'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Cursor custom del sitio público: un punto que sigue al mouse de cerca y un
 * círculo que lo sigue con más retraso y se agranda sobre lo clickeable.
 *
 * Tres decisiones a no deshacer:
 *  1. Posición por transform, NUNCA por estado de React. El loop de
 *     requestAnimationFrame escribe `style.transform` directo en los nodos
 *     (vía ref): cero re-renders por frame, así no compite con GSAP,
 *     ScrollTrigger y la paginación. El único estado de React es el flag
 *     "sobre algo clickeable", que se actualiza sólo cuando cambia. El loop
 *     además se duerme cuando el cursor llegó a destino y se despierta con el
 *     próximo movimiento.
 *  2. Delegación de eventos: un solo listener en el document que resuelve con
 *     closest() si lo que está bajo el mouse es clickeable. Así funciona con
 *     todo lo que se monta después (obras y bloques que vienen de Supabase,
 *     páginas del CV recalculadas, etc.), no sólo con lo que existía al montar.
 *  3. Sólo sitio público con mouse real: no se monta en /panel (el artista
 *     escribe en campos) ni en dispositivos táctiles o sin hover. Sólo cuando
 *     está activo se oculta el cursor del sistema (clase en <html>, ver
 *     globals.css); en panel y touch el cursor del sistema queda intacto.
 *
 * Color: bitono — trazo claro con un contorno oscuro de 1px (color tinta). Se
 * probó mix-blend-mode: difference y se descartó: sobre los tonos medios del
 * hero (el cielo gris azulado de la pintura) la inversión da otro gris medio y
 * el anillo casi desaparecía. El bitono contrasta contra cualquier fondo:
 * claro sobre el hero y las obras oscuras, contorno oscuro sobre el papel.
 * Con prefers-reduced-motion sigue la posición directa (sin arrastre ni
 * animación de tamaño).
 */

// Lo que agranda el círculo. `data-cursor="click"` queda como gancho para
// cualquier elemento clickeable que no sea a/button; `data-cursor-ignore` (en
// el elemento o un ancestro) lo excluye.
const CLICKEABLE =
  'a[href], button:not(:disabled), [role="button"], [role="tab"], summary, label[for], select, [data-cursor="click"]';

const MOUSE_REAL = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const CLASE_HTML = 'cursor-custom';

// Rapidez del seguimiento (1/s) del suavizado exponencial: el punto casi
// pegado, el círculo con arrastre.
const RAPIDEZ_PUNTO = 40;
const RAPIDEZ_CIRCULO = 9;

// Contorno oscuro (tinta al 55%) por fuera y por dentro del anillo claro, y
// alrededor del punto: lo que lo hace visible sobre el papel claro.
const SOMBRA_ANILLO = 'shadow-[0_0_0_1px_rgba(0,0,20,0.55),inset_0_0_0_1px_rgba(0,0,20,0.55)]';
const SOMBRA_PUNTO = 'shadow-[0_0_0_1px_rgba(0,0,20,0.6)]';

export default function CursorCustom() {
  const pathname = usePathname();
  const enPanel = pathname?.startsWith('/panel') ?? false;
  const [mouseReal, setMouseReal] = useState(false);
  const [reducido, setReducido] = useState(false);

  // Capacidades del dispositivo (pueden cambiar: tablet con mouse, etc.).
  useEffect(() => {
    const mmMouse = window.matchMedia(MOUSE_REAL);
    const mmReducido = window.matchMedia(REDUCED_MOTION);
    const sync = () => {
      setMouseReal(mmMouse.matches);
      setReducido(mmReducido.matches);
    };
    sync();
    mmMouse.addEventListener('change', sync);
    mmReducido.addEventListener('change', sync);
    return () => {
      mmMouse.removeEventListener('change', sync);
      mmReducido.removeEventListener('change', sync);
    };
  }, []);

  if (enPanel || !mouseReal) return null;
  return <Cursor reducido={reducido} />;
}

function Cursor({ reducido }: { reducido: boolean }) {
  const puntoRef = useRef<HTMLDivElement>(null);
  const circuloRef = useRef<HTMLDivElement>(null);
  const [sobreClickeable, setSobreClickeable] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const punto = puntoRef.current;
    const circulo = circuloRef.current;
    if (!punto || !circulo) return;

    document.documentElement.classList.add(CLASE_HTML);

    const destino = { x: 0, y: 0 };
    const posPunto = { x: 0, y: 0 };
    const posCirculo = { x: 0, y: 0 };
    let raf = 0;
    let ultimo = 0;
    let dentro = false;
    let clickeablePrevio = false;
    let visiblePrevio = false;

    const escribir = () => {
      punto.style.transform = `translate3d(${posPunto.x}px, ${posPunto.y}px, 0)`;
      circulo.style.transform = `translate3d(${posCirculo.x}px, ${posCirculo.y}px, 0)`;
    };

    const setClickeable = (v: boolean) => {
      if (v === clickeablePrevio) return;
      clickeablePrevio = v;
      setSobreClickeable(v);
    };
    const setVis = (v: boolean) => {
      if (v === visiblePrevio) return;
      visiblePrevio = v;
      setVisible(v);
    };

    function frame(t: number) {
      const dt = Math.min((t - ultimo) / 1000, 0.1);
      ultimo = t;
      const aPunto = reducido ? 1 : 1 - Math.exp(-RAPIDEZ_PUNTO * dt);
      const aCirculo = reducido ? 1 : 1 - Math.exp(-RAPIDEZ_CIRCULO * dt);
      posPunto.x += (destino.x - posPunto.x) * aPunto;
      posPunto.y += (destino.y - posPunto.y) * aPunto;
      posCirculo.x += (destino.x - posCirculo.x) * aCirculo;
      posCirculo.y += (destino.y - posCirculo.y) * aCirculo;
      escribir();
      // Llegó (menos de 0.1px): el loop se duerme hasta el próximo mousemove.
      const resta = Math.abs(destino.x - posCirculo.x) + Math.abs(destino.y - posCirculo.y);
      raf = resta > 0.1 ? requestAnimationFrame(frame) : 0;
    }

    function despertar() {
      if (raf) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function onMove(e: MouseEvent) {
      destino.x = e.clientX;
      destino.y = e.clientY;
      if (!dentro) {
        // Entró (o volvió) a la ventana: aparece donde está el mouse, sin
        // "viajar" desde la última posición conocida.
        dentro = true;
        posPunto.x = posCirculo.x = destino.x;
        posPunto.y = posCirculo.y = destino.y;
        escribir();
      }
      setVis(true);
      despertar();
    }

    function onOver(e: MouseEvent) {
      const el = e.target instanceof Element ? e.target : null;
      // Sobre un iframe (videos de obra) el document deja de recibir eventos
      // y adentro rige el cursor del iframe: se oculta el custom para que no
      // quede congelado en el borde.
      if (el?.tagName === 'IFRAME') {
        dentro = false;
        setVis(false);
        return;
      }
      // data-cursor-ignore: clickeable a propósito "invisible" (el acceso oculto
      // al panel en Contactame.4) — el círculo no se agranda para no delatarlo.
      const clickeable = el?.closest(CLICKEABLE);
      setClickeable(!!clickeable && !clickeable.closest('[data-cursor-ignore]'));
    }

    function onSalir(e: MouseEvent) {
      // relatedTarget null = el mouse salió de la ventana.
      if (e.relatedTarget) return;
      dentro = false;
      setVis(false);
    }

    function onOcultar() {
      dentro = false;
      setVis(false);
    }

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout', onSalir, { passive: true });
    window.addEventListener('blur', onOcultar);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onSalir);
      window.removeEventListener('blur', onOcultar);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove(CLASE_HTML);
    };
  }, [reducido]);

  // Transiciones sólo de tamaño/relleno (CSS); la posición la escribe el loop.
  // En Tailwind v4 scale-* usa la propiedad CSS `scale` (no `transform`), por
  // eso se transiciona `scale` explícitamente.
  const transicion = reducido ? '' : 'transition-[scale,background-color] duration-200 ease-out';
  return (
    <div
      aria-hidden="true"
      data-cursor-custom=""
      className={`pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div ref={circuloRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`-translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border-[1.5px] border-claro ${SOMBRA_ANILLO} ${transicion} ${
            sobreClickeable ? 'scale-[1.75] bg-claro/15' : 'scale-100'
          }`}
        />
      </div>
      <div ref={puntoRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className={`-translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-claro ${SOMBRA_PUNTO} ${transicion} ${
            sobreClickeable ? 'scale-50' : 'scale-100'
          }`}
        />
      </div>
    </div>
  );
}
