'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { label: 'SOCIALS', href: '#contacto' },
  { label: 'BIO', href: '#bio' },
  { label: 'CAV', href: '#cav' },
  { label: 'WORK', href: '#work' },
];

const BREAKPOINT_MOBILE = '(max-width: 767px)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

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
        // sólido con su propia copia chica (ver nota de stacking más abajo).
        gsap.set(navBg, { opacity: 1 });
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
        tl.to(navBg, { opacity: 1, ease: 'none' }, 0);
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
        { x: deltaX, y: deltaY, scale: scaleTarget, ease: 'none', duration: 1 },
        0,
      ).to(navBg, { opacity: 1, ease: 'none', duration: 1 }, 0);
      if (heroSub) tl.to(heroSub, { opacity: 0, y: -10, ease: 'none', duration: 1 }, 0);
      // El hero queda sticky (pinned) detrás de todo el resto de la página
      // para el efecto "el papel tapa al hero", así que el título que voló
      // hasta acá queda tapado para siempre por el fondo sólido del navbar
      // (z-50, por encima del hero z-0) apenas navBg llega a opacity:1 en
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
      <div ref={navBgRef} className="absolute inset-0 opacity-0 bg-navbar" />
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
