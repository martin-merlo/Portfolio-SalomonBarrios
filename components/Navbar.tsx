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
      // El hero queda sticky (pinned) detrás de todo el resto de la página
      // para el efecto "el papel tapa al hero", así que el título que voló
      // hasta acá queda tapado por el gradiente del navbar (z-50, por
      // encima del hero z-0) apenas navBg llega a su opacidad plena en
      // t=1. Por eso el "aterrizaje" real es este fade-in de navSlot — vive
      // dentro de <nav>, por encima de su propio fondo — no el título del
      // hero llegando literalmente. Arranca en t=0.7, ANTES de que navBg
      // termine de taparlo en t=1, así hay superposición real entre ambas
      // curvas de opacidad y nunca queda un tramo sin ninguna de las dos
      // copias visible.
      tl.to(navSlot, { opacity: 1, ease: 'none', duration: 0.5 }, 0.7);
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
      <ul className="relative z-10 flex gap-2 sm:gap-7 font-mono font-bold uppercase text-[0.55rem] sm:text-sm tracking-wide text-claro shrink-0">
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
