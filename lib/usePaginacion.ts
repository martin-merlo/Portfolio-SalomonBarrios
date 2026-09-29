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
 * visibles (la misma se usa en el clon de medición). Recalcula al cambiar el
 * ancho de ventana (debounce 200ms) y cuando terminan de cargar las fuentes
 * (cambian las métricas). Sólo para componentes de cliente.
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
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalcular, 200);
    }
    window.addEventListener('resize', onResize);

    // Las fuentes self-hosted todavía corren con fallback (ver
    // public/fonts/README.md); cuando llegan, las métricas cambian y hay que
    // repaginar.
    document.fonts?.ready?.then(() => recalcular());

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  }, [recalcular]);

  const ir = useCallback(
    (delta: number) => setPagina((v) => (v + delta + total) % total),
    [total],
  );

  return { contenedorRef, paginas, pagina, setPagina, ir, total };
}
