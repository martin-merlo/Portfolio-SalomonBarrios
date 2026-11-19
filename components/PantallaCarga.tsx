'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { textos, type Idioma } from '@/lib/i18n';
import { CLAVE_CARGA } from '@/lib/pantallaCarga';

// sessionStorage (CLAVE_CARGA): la pantalla se ve una sola vez por sesión del
// navegador (al entrar al sitio, sea por el home o por una página de obra). El
// script del <head> (ver app/layout.tsx) lee la misma clave y la oculta antes
// del primer pintado, así una recarga no la hace parpadear.

// Texturas fijas del sitio (fondos CSS que el DOM no expone como <img>).
const TEXTURAS = [
  '/imagenes/fondo-infinito.webp',
  '/imagenes/borde-ornamental.png',
  '/imagenes/forma-recorte.png',
  '/imagenes/grano.png',
];

declare global {
  interface Window {
    /** Lo define el script del <head> (app/layout.tsx): libera el scroll. */
    __liberarCarga?: (() => void) | null;
  }
}

// Mínimo para que la barra se lea y no sea un parpadeo; máximo para que una red
// lenta o un archivo caído nunca dejen a nadie trabado.
const MINIMO_MS = 800;
const MAXIMO_MS = 8000;
const SALIDA_MS = 500;

function cargarImagen(url: string): Promise<void> {
  return new Promise((listo) => {
    const img = new Image();
    img.onload = img.onerror = () => listo();
    img.src = url;
  });
}

function enPantalla(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0;
}

/** Lo que tiene que estar listo para mostrar la página sin huecos. */
function tareasCriticas(): Promise<unknown>[] {
  const tareas: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve()];
  TEXTURAS.forEach((url) => tareas.push(cargarImagen(url)));
  // Imágenes visibles al entrar (el hero, la obra) y las marcadas como
  // prioritarias. Las de más abajo siguen diferidas: se cargan al scrollear.
  document.querySelectorAll('img').forEach((img) => {
    if (img.closest('#pantalla-carga')) return;
    if (!enPantalla(img) && img.fetchPriority !== 'high') return;
    if (img.complete) return;
    img.loading = 'eager';
    tareas.push(new Promise<void>((listo) => {
      img.addEventListener('load', () => listo(), { once: true });
      img.addEventListener('error', () => listo(), { once: true });
    }));
  });
  // Fondos CSS en línea visibles (p. ej. la imagen de la obra en su página).
  document.querySelectorAll<HTMLElement>('[style*="background-image"]').forEach((el) => {
    const url = /url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage)?.[1];
    if (url && enPantalla(el)) tareas.push(cargarImagen(url));
  });
  return tareas;
}

/**
 * Pantalla de carga de la primera visita: barra con el avance real de lo que
 * se ve al entrar (fuentes, texturas, imágenes en pantalla). Montada una vez en
 * el layout raíz: la navegación entre páginas no la vuelve a mostrar.
 *
 * - Sale en el HTML del servidor (no hay forma de saber ahí si ya se vio), así
 *   cubre desde el primer pintado; si ya se vio en la sesión, el script del
 *   <head> la oculta antes de pintar y este componente se desmonta solo.
 * - Mientras carga, el scroll queda bloqueado: lo bloquea el script del <head>
 *   antes del primer pintado (ver app/layout.tsx) y acá se libera al terminar
 *   con window.__liberarCarga.
 * - Redes de seguridad: sin JavaScript no aparece (<noscript> en el layout) y,
 *   si el JS fallara, una animación CSS la oculta sola a los 12s.
 * - No va en /panel.
 */
export default function PantallaCarga({ idioma }: { idioma: Idioma }) {
  const pathname = usePathname();
  const [estado, setEstado] = useState<'cargando' | 'saliendo' | 'lista'>('cargando');
  const barraRef = useRef<HTMLDivElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const enPanel = pathname.startsWith('/panel');

  useEffect(() => {
    if (enPanel) return;
    if (document.documentElement.hasAttribute('data-cargado')) {
      setEstado('lista');
      return;
    }
    const liberar = () => window.__liberarCarga?.();

    let cancelado = false;
    const inicio = performance.now();
    const tareas = tareasCriticas();
    let hechas = 0;
    const avanzar = () => {
      hechas++;
      const p = hechas / tareas.length;
      if (barraRef.current) barraRef.current.style.transform = `scaleX(${p})`;
      contenedorRef.current?.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    };
    tareas.forEach((t) => t.then(avanzar, avanzar));

    const tope = new Promise((listo) => setTimeout(listo, MAXIMO_MS));
    Promise.race([Promise.allSettled(tareas), tope]).then(async () => {
      const resta = MINIMO_MS - (performance.now() - inicio);
      if (resta > 0) await new Promise((listo) => setTimeout(listo, resta));
      if (cancelado) return;
      if (barraRef.current) barraRef.current.style.transform = 'scaleX(1)';
      try {
        sessionStorage.setItem(CLAVE_CARGA, '1');
      } catch {}
      liberar();
      setEstado('saliendo');
      setTimeout(() => !cancelado && setEstado('lista'), SALIDA_MS);
    });

    return () => {
      cancelado = true;
      liberar();
    };
  }, [enPanel]);

  if (enPanel || estado === 'lista') return null;

  const tx = textos(idioma);
  return (
    <div
      id="pantalla-carga"
      ref={contenedorRef}
      role="progressbar"
      aria-label={tx.cargando}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      className={`fixed inset-0 z-[8999] flex flex-col items-center justify-center gap-4 bg-tinta transition-opacity duration-500 motion-reduce:duration-0 ${
        estado === 'saliendo' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <span className="font-mono uppercase tracking-[0.3em] text-claro/80 text-xs sm:text-sm">{tx.cargando}</span>
      <div className="w-48 sm:w-64 h-px bg-claro/20 overflow-hidden">
        <div
          ref={barraRef}
          className="h-full w-full bg-claro origin-left transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
    </div>
  );
}
