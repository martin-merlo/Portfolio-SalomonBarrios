'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ITEMS = [
  { label: 'BIO', href: '/#bio' },
  { label: 'WORK', href: '/#work' },
  { label: 'CV', href: '/#cav' },
  { label: 'SOCIALS', href: '/#contacto' },
];

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
export default function NavbarObra({ nombreArtista }: { nombreArtista: string }) {
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
        className="relative z-10 font-display uppercase text-claro leading-none whitespace-nowrap shrink-0 text-base sm:text-lg hover:opacity-80 transition-opacity"
      >
        {nombreArtista}
      </Link>
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
