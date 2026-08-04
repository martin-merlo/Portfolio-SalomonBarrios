'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

const ANCHO_BORDE = 'w-[52px] sm:w-[80px] lg:w-[110px]';
const ALTO_TIRA = 'h-[52px] sm:h-[80px] lg:h-[110px]';

/**
 * Tira decorativa borde-ornamental.png (2080x500, dibujo en la mitad
 * inferior) rotada 90° para usarla como borde vertical en ambos márgenes.
 * Truco de "caja invertida + rotate": la tira interior arranca con ancho y
 * alto invertidos respecto al resultado final (ancho = alto del propio
 * contenedor exterior, medido en vivo porque no hay forma en CSS puro de
 * decir "mi ancho = el alto de mi padre"; alto = grosor del borde), pinta
 * su fondo sin rotar (repeat-x a lo largo de ese ancho), y luego se rota
 * 90° sobre su propio centro — que coincide con el centro del contenedor
 * exterior — dejando el resultado exactamente encajado.
 *
 * Montado como hijo de PaperSurface (no global en page.tsx): position
 * absolute + inset-y-0 lo acota exactamente a la altura de esa sección de
 * papel, así nunca se renderiza sobre el hero (un sibling anterior, fuera
 * de este contenedor). Sin z-index propio y ubicado ANTES que {children}
 * en el JSX de PaperSurface: al no estar posicionado con z-index explícito
 * pinta en el mismo nivel de stacking que el contenido normal, ordenado
 * por posición en el DOM, así que cualquier sección con fondo opaco que
 * venga después (las cards del work, por ejemplo) lo tapa de verdad.
 */
export default function BordeOrnamental() {
  const izqOuterRef = useRef<HTMLDivElement>(null);
  const derOuterRef = useRef<HTMLDivElement>(null);
  const izqInnerRef = useRef<HTMLDivElement>(null);
  const derInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outers = [izqOuterRef.current, derOuterRef.current].filter(
      (el): el is HTMLDivElement => el !== null,
    );
    const inners = [izqInnerRef.current, derInnerRef.current].filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (outers.length === 0) return;

    function medir() {
      const alto = outers[0].offsetHeight;
      inners.forEach((el) => {
        el.style.width = `${alto}px`;
      });
    }
    medir();

    const ro = new ResizeObserver(medir);
    outers.forEach((el) => ro.observe(el));
    window.addEventListener('resize', medir);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, []);

  useEffect(() => {
    const mmReduced = window.matchMedia(REDUCED_MOTION);
    if (mmReduced.matches) return;

    const targets = [izqOuterRef.current, derOuterRef.current].filter(
      (el): el is HTMLDivElement => el !== null,
    );
    if (targets.length === 0) return;

    // Mismo scroll de referencia que el título anclado: document.body de
    // punta a punta, no el de una sección — si se atara al scroll de un
    // contenedor interno, la proporción real dejaría de ser 0.5 según en
    // qué parte de la página se calculara.
    if (derOuterRef.current) gsap.set(derOuterRef.current, { scaleX: -1 });

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        gsap.set(targets, { y: self.scroll() * 0.5 });
      },
    });

    // 'bottom bottom' se resuelve a un scrollY absoluto en el momento del
    // create(), que puede ser bastante antes de que el alto real del
    // documento termine de asentarse (medido: el body pasa de ~3538px a
    // ~5683px recién cuando document.fonts.ready resuelve, por el reflow
    // del swap de la fuente real). Sin refrescar, ese 'end' queda corto:
    // pasado ese punto el trigger deja de estar activo y el borde se
    // congela en vez de seguir la proporción 0.5 hasta el final real de la
    // página. Mismo patrón de recálculo que el título anclado (Navbar) y
    // la paginación del CV (Cav): resize con debounce + fonts.ready. Sumamos
    // un ResizeObserver sobre <body> porque el reflow que dispara esto no
    // llega a través de un evento 'resize' de window.
    let refreshTimer: ReturnType<typeof setTimeout>;
    function refrescar() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => st.refresh(), 200);
    }

    window.addEventListener('resize', refrescar);
    document.fonts?.ready?.then(refrescar);

    const ro = new ResizeObserver(refrescar);
    ro.observe(document.body);

    return () => {
      window.removeEventListener('resize', refrescar);
      ro.disconnect();
      clearTimeout(refreshTimer);
      st.kill();
    };
  }, []);

  return (
    <>
      <div
        ref={izqOuterRef}
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 overflow-hidden ${ANCHO_BORDE}`}
        style={{ pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.75 }}
      >
        <div
          ref={izqInnerRef}
          className={`absolute top-1/2 left-1/2 ${ALTO_TIRA}`}
          style={{
            transform: 'translate(-50%, -50%) rotate(90deg)',
            backgroundImage: "url('/imagenes/borde-ornamental.png')",
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
          }}
        />
      </div>

      <div
        ref={derOuterRef}
        aria-hidden="true"
        className={`absolute inset-y-0 right-0 overflow-hidden ${ANCHO_BORDE}`}
        style={{ pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.75 }}
      >
        <div
          ref={derInnerRef}
          className={`absolute top-1/2 left-1/2 ${ALTO_TIRA}`}
          style={{
            transform: 'translate(-50%, -50%) rotate(90deg)',
            backgroundImage: "url('/imagenes/borde-ornamental.png')",
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
          }}
        />
      </div>
    </>
  );
}
