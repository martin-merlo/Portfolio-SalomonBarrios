'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { label: 'BIO', href: '#bio' },
  { label: 'WORK', href: '#work' },
  { label: 'CV', href: '#cav' },
  { label: 'SOCIALS', href: '#contacto' },
];

const BREAKPOINT_MOBILE = '(max-width: 767px)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Fondo del navbar: gradiente vertical (color navbar → transparente, stops a
// full alpha) en vez de color plano. NAVBG_MAX_OPACITY es la opacidad global
// del elemento — 80% pedido por el artista — y es el techo al que anima con
// el scroll (antes 1, fondo sólido).
const NAVBG_MAX_OPACITY = 0.8;

/**
 * Título anclado al navbar — mecánica portada de referencia/demos/anchor.html.
 * Mide la posición del título del hero y la del slot del navbar, y anima
 * x/y/scale con scrub (FLIP manual). En mobile reemplaza esa transición de
 * posición por un crossfade simple. Recalcula todo en resize (debounced).
 */
export default function Navbar({ heroTitulo }: { heroTitulo: string }) {
  const navSlotRef = useRef<HTMLSpanElement>(null);
  const navBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroTitleEl = document.getElementById('hero-title');
    const heroSub = document.getElementById('hero-sub');
    const heroDecl = document.getElementById('hero-declaracion');
    const navSlotEl = navSlotRef.current;
    const navBgEl = navBgRef.current;
    if (!heroTitleEl || !navSlotEl || !navBgEl) return;

    const heroTitle = heroTitleEl;
    const navSlot = navSlotEl;
    const navBg = navBgEl;

    const mmSmall = window.matchMedia(BREAKPOINT_MOBILE);
    const mmReduced = window.matchMedia(REDUCED_MOTION);

    let st: ScrollTrigger | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;

    function setup() {
      if (st) {
        st.kill();
        st = undefined;
      }
      gsap.set(heroTitle, { clearProps: 'all' });
      gsap.set(navSlot, { clearProps: 'opacity' });
      gsap.set(navBg, { clearProps: 'opacity' });
      if (heroSub) gsap.set(heroSub, { clearProps: 'all' });
      if (heroDecl) gsap.set(heroDecl, { clearProps: 'all' });

      // Distancia real de scroll que tarda PaperSurface (z-10, en flujo
      // normal) en cubrir por completo al hero (sticky, h-screen, z-0):
      // exactamente la altura del hero. Medirla en vivo en vez de usar un
      // valor fijo evita que el título termine su recorrido antes o
      // después de que el papel lo tape, lo que dejaba un hueco donde no
      // se veía ni el título volando ni la copia fija del navbar.
      const heroSection = document.getElementById('hero');
      const heroHeight = heroSection
        ? heroSection.getBoundingClientRect().height
        : window.innerHeight;

      if (mmReduced.matches) {
        // Sin scrub: estado final estático de una, nada ligado al scroll.
        // El título grande queda como está en el hero; el navbar ya arranca
        // con su gradiente pleno y su propia copia chica (ver nota de
        // stacking más abajo).
        gsap.set(navBg, { opacity: NAVBG_MAX_OPACITY });
        gsap.set(navSlot, { visibility: 'visible', opacity: 1 });
        return;
      }

      if (mmSmall.matches) {
        // Mobile: crossfade simple en vez de mover/escalar el título.
        gsap.set(navSlot, { visibility: 'visible', opacity: 0 });
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: `+=${heroHeight}`,
            scrub: 0.4,
          },
        });
        tl.to(heroTitle, { opacity: 0, ease: 'none' }, 0).to(
          navSlot,
          { opacity: 1, ease: 'none' },
          0,
        );
        tl.to(navBg, { opacity: NAVBG_MAX_OPACITY, ease: 'none' }, 0);
        if (heroSub) tl.to(heroSub, { opacity: 0, ease: 'none' }, 0);
        if (heroDecl) tl.to(heroDecl, { opacity: 0, ease: 'none' }, 0);
        st = tl.scrollTrigger;
        return;
      }

      // Desktop: delta de posición entre el título del hero y el slot del navbar.
      // navSlot arranca invisible (opacity, no visibility: necesitamos poder
      // hacerle fundido) y solo se usa para MEDIR el punto de llegada.
      gsap.set(navSlot, { visibility: 'visible', opacity: 0 });
      const heroRect = heroTitle.getBoundingClientRect();
      const navRect = navSlot.getBoundingClientRect();

      const deltaX = navRect.left - heroRect.left;
      const deltaY = navRect.top + navRect.height / 2 - (heroRect.top + heroRect.height / 2);
      const scaleTarget = (navRect.height / heroRect.height) * 1.85;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: `+=${heroHeight}`,
          scrub: 0.4,
        },
      });
      tl.to(
        heroTitle,
        {
          x: deltaX,
          y: deltaY,
          scale: scaleTarget,
          // deltaX/deltaY están medidos borde-izquierdo a borde-izquierdo
          // (navRect.left - heroRect.left), así que el ancla del scale tiene
          // que ser ese mismo borde izquierdo para que el cálculo cierre. El
          // style inline transformOrigin:'left center' del h1 (Hero.tsx) NO
          // alcanza: gsap, la primera vez que anima un transform en un
          // elemento sin que el propio tween declare transformOrigin, lo
          // pisa a su default '50% 50%' escribiéndolo inline él mismo — deja
          // el ancla en el centro sin avisar. Sin esto la escala tira el
          // título hacia la derecha (la mitad de su ancho original, sin
          // escalar) y se come buena parte del corrimiento a la izquierda
          // que pide deltaX, dejando la trayectoria casi vertical otra vez.
          transformOrigin: 'left center',
          ease: 'none',
          duration: 1,
        },
        0,
      ).to(navBg, { opacity: NAVBG_MAX_OPACITY, ease: 'none', duration: 1 }, 0);
      if (heroSub) tl.to(heroSub, { opacity: 0, y: -10, ease: 'none', duration: 1 }, 0);
      // Mismo tween que #hero-sub: el bloque de la declaración (título + texto)
      // se funde parejo con el subtítulo del nombre. Misma curva (ease:'none'),
      // mismo timing (posición 0, duration 1) y mismo y:-10 de deriva.
      if (heroDecl) tl.to(heroDecl, { opacity: 0, y: -10, ease: 'none', duration: 1 }, 0);
      // Cruce de las dos copias del título ("que vuela" vs. la fija del
      // navbar). OJO antes de tocar esto: las dos curvas de opacidad se
      // superponen A PROPÓSITO — es la solución a un bug de hace varias
      // iteraciones donde, en cierto tramo del scroll, no se veía NINGUNA de
      // las dos copias (un hueco). No eliminar la superposición; solo se
      // ajustó SU TIMING.
      //
      // heroTitle (la que vuela) se queda en opacity:1 toda la trayectoria y
      // recién se apaga en el 10% final (0.9→1), cuando por el tween de
      // arriba ya está prácticamente encima de su destino (x/y/scale también
      // llegan a su valor final en t=1). navSlot (la copia fija) arranca su
      // fade-in un poco antes, en 0.85, así que entre 0.85 y 0.9 aparece sola
      // y suave (todavía sin competencia, la que vuela sigue a opacity:1) y
      // de 0.9 a 1 ambas transicionan juntas en la MISMA zona del navbar —
      // eso es lo que hace que el cruce no se lea como "dos títulos"
      // separados pisándose, que es justo lo que pasaba cuando la
      // trayectoria se hizo más diagonal (la que volaba todavía estaba lejos
      // del destino, a opacity:1, cuando la copia fija ya estaba apareciendo).
      //
      // Todos los tweens de este timeline (posición, navBg, heroSub, y estos
      // dos) terminan exactamente en t=1 — ningún tween se extiende más
      // allá — así el timeline entero dura 1 y el progreso de scroll mapea
      // 1:1 al tiempo del timeline. (Antes navSlot arrancaba en 0.7 con
      // duration 0.5, terminando en t=1.2: eso estiraba la duración total del
      // timeline a 1.2 y desincronizaba scroll-progress de tiempo-de-tween,
      // que es la causa real de por qué la copia fija aparecía mientras la
      // que volaba todavía estaba a mitad de camino.)
      tl.to(heroTitle, { opacity: 0, ease: 'none', duration: 0.1 }, 0.9);
      tl.to(navSlot, { opacity: 1, ease: 'none', duration: 0.15 }, 0.85);
      st = tl.scrollTrigger;
    }

    setup();

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 200);
    }
    window.addEventListener('resize', onResize);
    mmSmall.addEventListener('change', setup);
    mmReduced.addEventListener('change', setup);

    return () => {
      window.removeEventListener('resize', onResize);
      mmSmall.removeEventListener('change', setup);
      mmReduced.removeEventListener('change', setup);
      clearTimeout(resizeTimer);
      if (st) st.kill();
    };
  }, []);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 sm:h-[72px] flex items-center justify-between gap-2 px-3 sm:px-8 lg:px-12">
      <div
        ref={navBgRef}
        aria-hidden="true"
        className="absolute inset-0 opacity-0"
        style={{ backgroundImage: 'linear-gradient(to bottom, var(--color-navbar), transparent)' }}
      />
      <span
        ref={navSlotRef}
        aria-hidden="true"
        className="relative z-10 font-display uppercase text-claro leading-none whitespace-nowrap shrink-0"
        style={{ visibility: 'hidden', opacity: 0, fontSize: 'clamp(0.6rem, 3.6vw, 1.125rem)' }}
      >
        {heroTitulo}
      </span>
      <ul className="relative z-10 flex gap-2 sm:gap-6 lg:gap-8 font-mono font-bold uppercase text-xs sm:text-base lg:text-lg tracking-wide text-claro shrink-0">
        {ITEMS.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="hover:opacity-70 transition-opacity">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
