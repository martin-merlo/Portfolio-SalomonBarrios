import { useCallback, useEffect, useRef, useState } from 'react';
import { paginarHtml } from './paginarHtml';

/**
 * Paginación automática de un texto enriquecido largo dentro de una caja de
 * alto fijo (la usan el CV y la Declaración del artista). `html` tiene que
 * venir YA SANITIZADO (lo sanitiza el server component padre, ver
 * lib/sanitizarHtml.ts). Mide el alto real del contenido renderizado — no
 * cuenta caracteres — así negritas, listas y links paginan bien (ver
 * lib/paginarHtml.ts).
 *
 * El contenedor al que se ata `contenedorRef` es la caja medida: su ancho/alto
 * es el espacio de cada página, así que no debe llevar padding propio (ponerlo
 * en un wrapper exterior). `clase` es la clase tipográfica de las páginas
 * visibles (la misma se usa en el clon de medición). Recalcula cuando cambia
 * el TAMAÑO DE LA CAJA (ResizeObserver, debounce 150ms: cubre el resize de la
 * ventana y también la caja que toma el alto sobrante del hero en mobile, que
 * cambia cuando cargan las fuentes del título/subtítulo) y cuando terminan de
 * cargar las fuentes. Sólo para componentes de cliente.
 */
export function usePaginacion(html: string, clase: string) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<string[]>([html]);
  const [pagina, setPagina] = useState(0);
  const total = paginas.length;

  const recalcular = useCallback(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nuevas = paginarHtml(html, rect.height, rect.width, clase);
    setPaginas(nuevas);
    setPagina((actual) => (actual >= nuevas.length ? 0 : actual));
  }, [html, clase]);

  useEffect(() => {
    recalcular();

    let resizeTimer: ReturnType<typeof setTimeout>;
    let ultimo = { w: -1, h: -1 };
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalcular, 150);
    }
    // Sólo si cambió el tamaño de la caja (no por cualquier re-layout).
    const ro = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      if (Math.abs(width - ultimo.w) < 0.5 && Math.abs(height - ultimo.h) < 0.5) return;
      const primera = ultimo.w < 0;
      ultimo = { w: width, h: height };
      if (!primera) onResize();
    });
    if (contenedorRef.current) ro.observe(contenedorRef.current);

    // Las fuentes self-hosted todavía corren con fallback (ver
    // public/fonts/README.md); cuando llegan, las métricas cambian y hay que
    // repaginar.
    document.fonts?.ready?.then(() => recalcular());

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimer);
    };
  }, [recalcular]);

  const ir = useCallback(
    (delta: number) => setPagina((v) => (v + delta + total) % total),
    [total],
  );

  return { contenedorRef, paginas, pagina, setPagina, ir, total };
}
