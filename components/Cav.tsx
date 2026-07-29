'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SectionLabel from './SectionLabel';

const CLASE_TEXTO_PAGINA = 'font-cuerpo text-sm sm:text-base leading-relaxed pr-2 sm:pr-6';

/**
 * Mide cuánto de `texto` entra en una caja de `anchoPx` de ancho y
 * `altoMax` de alto, con la tipografía/tamaño/padding reales (mismas
 * clases que el panel visible), usando un clon oculto adjunto al body.
 * Corta por búsqueda binaria del máximo de caracteres que entran y
 * retrocede al último espacio/salto de línea para no partir una palabra.
 */
function medirPaginas(texto: string, altoMax: number, anchoPx: number): string[] {
  if (!texto.trim() || altoMax <= 0 || anchoPx <= 0) return [texto];

  const clon = document.createElement('div');
  clon.className = CLASE_TEXTO_PAGINA;
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

    // Palabra suelta más ancha que la caja entera: caso límite, cortar
    // igual para no quedar en loop infinito.
    if (corte <= inicio) corte = inicio + Math.max(1, lo);

    paginas.push(texto.slice(inicio, corte).trim());
    inicio = corte;
    while (inicio < texto.length && /\s/.test(texto[inicio])) inicio++;
  }

  document.body.removeChild(clon);
  return paginas.length > 0 ? paginas : [''];
}

export default function Cav({ texto }: { texto: string }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<string[]>([texto]);
  const [pagina, setPagina] = useState(0);
  const total = paginas.length;

  const recalcular = useCallback(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nuevas = medirPaginas(texto, rect.height, rect.width);
    setPaginas(nuevas);
    setPagina((actual) => (actual >= nuevas.length ? 0 : actual));
  }, [texto]);

  useEffect(() => {
    recalcular();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalcular, 200);
    }
    window.addEventListener('resize', onResize);

    // La fuente PS Pimpdeed II todavía corre con el fallback monoespaciado
    // (ver public/fonts/README.md); cuando llegue el archivo real las
    // métricas de ancho cambian y hay que repaginar.
    document.fonts?.ready?.then(() => recalcular());

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  }, [recalcular]);

  function ir(delta: number) {
    setPagina((v) => (v + delta + total) % total);
  }

  return (
    <section id="cav" className="px-5 sm:px-10 lg:px-14 pb-20 sm:pb-28">
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="CV.3" />

        <div
          ref={contenedorRef}
          className="relative overflow-hidden h-[360px] sm:h-[420px] lg:h-[460px]"
        >
          <div
            className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0"
            style={{ transform: `translateX(-${pagina * 100}%)` }}
          >
            {paginas.map((contenido, i) => (
              <div
                key={i}
                role="tabpanel"
                aria-hidden={i !== pagina}
                className={`w-full h-full shrink-0 ${CLASE_TEXTO_PAGINA}`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {contenido}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8">
          <button
            onClick={() => ir(-1)}
            aria-label="Página anterior"
            className="font-mono text-tinta w-9 h-9 flex items-center justify-center rounded-full border border-tinta/30 hover:border-tinta transition-colors shrink-0"
          >
            ‹
          </button>

          <div role="tablist" aria-label="Páginas del CV" className="flex flex-wrap gap-2">
            {paginas.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === pagina}
                aria-label={`Página ${i + 1}`}
                onClick={() => setPagina(i)}
                className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                  i === pagina ? 'bg-tinta border-tinta' : 'border-tinta/35 hover:border-tinta'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => ir(1)}
            aria-label="Página siguiente"
            className="font-mono text-tinta w-9 h-9 flex items-center justify-center rounded-full border border-tinta/30 hover:border-tinta transition-colors shrink-0"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
