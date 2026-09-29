import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Mide cuánto de `texto` entra en una caja de `anchoPx` de ancho y `altoMax` de
 * alto, con la tipografía/tamaño/padding reales (la misma `clase` que usan las
 * páginas visibles), usando un clon oculto adjunto al body. Corta por búsqueda
 * binaria del máximo de caracteres que entran y retrocede al último
 * espacio/salto de línea para no partir una palabra.
 */
export function medirPaginas(
  texto: string,
  altoMax: number,
  anchoPx: number,
  clase: string,
): string[] {
  if (!texto.trim() || altoMax <= 0 || anchoPx <= 0) return [texto];

  const clon = document.createElement('div');
  clon.className = clase;
  Object.assign(clon.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    top: '0',
    left: '-9999px',
    height: 'auto',
    width: `${anchoPx}px`,
    whiteSpace: 'pre-line',
  });
  document.body.appendChild(clon);

  function entraCompleto(desde: number): boolean {
    clon.textContent = texto.slice(desde);
    return clon.scrollHeight <= altoMax;
  }

  function cortesHasta(desde: number, largo: number): number {
    clon.textContent = texto.slice(desde, desde + largo);
    return clon.scrollHeight;
  }

  const paginas: string[] = [];
  let inicio = 0;

  while (inicio < texto.length) {
    if (entraCompleto(inicio)) {
      paginas.push(texto.slice(inicio).trim());
      break;
    }

    const restante = texto.length - inicio;
    let lo = 0;
    let hi = restante;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi + 1) / 2);
      if (cortesHasta(inicio, mid) <= altoMax) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    let corte = inicio + lo;

    // Retroceder al último límite de palabra para no cortarla a la mitad.
    if (corte < texto.length && !/\s/.test(texto[corte])) {
      let retro = corte;
      while (retro > inicio && !/\s/.test(texto[retro - 1])) retro--;
      if (retro > inicio) corte = retro;
    }

    // Palabra suelta más ancha que la caja entera: caso límite, cortar igual
    // para no quedar en loop infinito.
    if (corte <= inicio) corte = inicio + Math.max(1, lo);

    paginas.push(texto.slice(inicio, corte).trim());
    inicio = corte;
    while (inicio < texto.length && /\s/.test(texto[inicio])) inicio++;
  }

  document.body.removeChild(clon);
  return paginas.length > 0 ? paginas : [''];
}

/**
 * Paginación automática de un texto largo dentro de una caja de alto fijo
 * (la usan el CV y la Declaración del artista). El contenedor al que se ata
 * `contenedorRef` es la caja medida: su ancho/alto es el espacio de cada
 * página, así que no debe llevar padding propio (ponerlo en un wrapper
 * exterior). Recalcula al cambiar el ancho de ventana (debounce 200ms) y
 * cuando terminan de cargar las fuentes (cambian las métricas de ancho).
 * Sólo para componentes de cliente.
 */
export function usePaginacion(texto: string, clase: string) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<string[]>([texto]);
  const [pagina, setPagina] = useState(0);
  const total = paginas.length;

  const recalcular = useCallback(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nuevas = medirPaginas(texto, rect.height, rect.width, clase);
    setPaginas(nuevas);
    setPagina((actual) => (actual >= nuevas.length ? 0 : actual));
  }, [texto, clase]);

  useEffect(() => {
    recalcular();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalcular, 200);
    }
    window.addEventListener('resize', onResize);

    // Las fuentes self-hosted todavía corren con fallback (ver
    // public/fonts/README.md); cuando llegan, las métricas de ancho cambian y
    // hay que repaginar.
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
