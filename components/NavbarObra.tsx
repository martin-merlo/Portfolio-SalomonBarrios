'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { textos, type Idioma } from '@/lib/i18n';
import SelectorIdioma from './SelectorIdioma';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Ítems del menú en el idioma activo (los ids de las secciones no cambian).
function itemsMenu(idioma: Idioma) {
  const n = textos(idioma).nav;
  return [
    { label: n.bio, href: '/#bio' },
    { label: n.work, href: '/#work' },
    { label: n.contacto, href: '/#contacto' },
    { label: n.cv, href: '/#cav' },
  ];
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Ver misma constante en Navbar.tsx: opacidad global del gradiente del
// fondo del navbar, 80% pedido por el artista.
const NAVBG_MAX_OPACITY = 0.8;

/**
 * Navbar de las páginas /obra/[slug]. A diferencia del Navbar del home, acá
 * el nombre del artista es chico y fijo siempre — sin la animación de
 * anclado, que es exclusiva del home (acá el protagonista del hero es el
 * título de la obra). Funciona como link a "/". Los otros cuatro items no
 * apuntan a secciones de esta página (no existen acá) sino de vuelta al home.
 *
 * Mismo criterio de transparencia que el Navbar del home: arranca sin fondo
 * (solo texto flotando sobre el hero) y gana el gradiente oscuro con scrub
 * a medida que se scrollea, en la misma distancia que tarda ObraHero
 * (sticky, z-0) en quedar tapado por PaperSurface. Sin la animación de
 * posición del título porque ObraHero no tiene ese mecanismo.
 */
export default function NavbarObra({ nombreArtista, idioma }: { nombreArtista: string; idioma: Idioma }) {
  const items = itemsMenu(idioma);
  const navBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const navBg = navBgRef.current;
    if (!navBg) return;

    const mmReduced = window.matchMedia(REDUCED_MOTION);
    let st: ScrollTrigger | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;

    function setup() {
      if (st) {
        st.kill();
        st = undefined;
      }
      gsap.set(navBg, { clearProps: 'opacity' });

      if (mmReduced.matches) {
        gsap.set(navBg, { opacity: NAVBG_MAX_OPACITY });
        return;
      }

      const heroSection = document.getElementById('obra-hero');
      const heroHeight = heroSection
        ? heroSection.getBoundingClientRect().height
        : window.innerHeight;

      st = ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: `+=${heroHeight}`,
        scrub: 0.4,
        onUpdate: (self) => gsap.set(navBg, { opacity: self.progress * NAVBG_MAX_OPACITY }),
      });
    }

    setup();

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setup, 200);
    }
    window.addEventListener('resize', onResize);
    mmReduced.addEventListener('change', setup);

    return () => {
      window.removeEventListener('resize', onResize);
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
      <Link
        href="/"
        className="relative z-10 font-display uppercase text-claro leading-none whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
        // Mismo tamaño fluido que la copia del título en el navbar del home
        // (Navbar.tsx). Antes era text-base fijo: en mobile (≤360px) el nombre
        // empujaba los ítems fuera de la pantalla.
        style={{ fontSize: 'clamp(0.6rem, 3.6vw, 1.125rem)' }}
      >
        {nombreArtista}
      </Link>
      {/* Mobile: gap-1.5 + tracking normal (y 11px por debajo de 360px) para que
          BIO · WORK · CONTACTO · CV entre en una fila junto al nombre aun a
          320px; desde sm: los mismos valores de siempre. */}
      <div className="relative z-10 flex items-center gap-10 xl:gap-12 shrink-0">
        {/* Toggle ES/EN: desde lg en la fila, a la izquierda de BIO con aire. */}
        <SelectorIdioma idioma={idioma} className="hidden lg:flex" />
        <ul className="flex gap-1.5 sm:gap-6 lg:gap-8 font-mono font-bold uppercase text-[11px] min-[360px]:text-xs sm:text-base lg:text-lg tracking-normal sm:tracking-wide text-claro">
          {items.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="hover:opacity-70 transition-opacity">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {/* Mobile y tablet (< lg): en la fila no entra (los 4 ítems ya llenan el
          ancho a 320px), así que va fijo justo debajo del navbar, a la derecha. */}
      <SelectorIdioma idioma={idioma} className="lg:hidden absolute top-full right-3 sm:right-8 mt-2" />
    </nav>
  );
}
