'use client';

import type { RefObject } from 'react';

/**
 * Piezas visuales de la paginación automática (ver lib/usePaginacion.ts),
 * compartidas por el CV (sobre papel claro) y la Declaración del artista (sobre
 * el hero oscuro).
 */

interface PistaPaginasProps {
  contenedorRef: RefObject<HTMLDivElement | null>;
  /** HTML de cada página, armado por lib/paginarHtml.ts (seguro por construcción). */
  paginas: string[];
  pagina: number;
  /** Clase tipográfica de cada página — la MISMA que se pasó al hook para medir. */
  clase: string;
  /** Alto fijo de la caja (lo que se mide como espacio de cada página). */
  alto: string;
}

export function PistaPaginas({ contenedorRef, paginas, pagina, clase, alto }: PistaPaginasProps) {
  return (
    <div ref={contenedorRef} className={`overflow-hidden ${alto}`}>
      <div
        className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0"
        style={{ transform: `translateX(-${pagina * 100}%)` }}
      >
        {paginas.map((contenido, i) => (
          // inert en las páginas ocultas: fuera de pantalla, sus links no
          // tienen que recibir foco de teclado ni clicks.
          <div
            key={i}
            role="tabpanel"
            aria-hidden={i !== pagina}
            inert={i !== pagina}
            className={`w-full h-full shrink-0 ${clase}`}
            dangerouslySetInnerHTML={{ __html: contenido }}
          />
        ))}
      </div>
    </div>
  );
}

// Clases completas (no armadas por interpolación) para que Tailwind las detecte.
const TONOS = {
  // Sobre papel claro (CV).
  tinta: {
    flecha:
      'font-mono text-tinta w-9 h-9 flex items-center justify-center rounded-full border border-tinta/30 hover:border-tinta transition-colors shrink-0',
    punto: 'w-2.5 h-2.5',
    activo: 'bg-tinta border-tinta',
    inactivo: 'border-tinta/35 hover:border-tinta',
  },
  // Sobre el hero oscuro (Declaración): claros, un poco más chicos y
  // translúcidos para no competir con el título grande del hero.
  claro: {
    flecha:
      'font-mono text-claro w-8 h-8 flex items-center justify-center rounded-full border border-claro/40 hover:border-claro hover:bg-claro/10 transition-colors shrink-0',
    punto: 'w-2 h-2',
    activo: 'bg-claro border-claro',
    inactivo: 'border-claro/50 hover:border-claro',
  },
} as const;

interface ControlesPaginasProps {
  total: number;
  pagina: number;
  onIr: (delta: number) => void;
  onElegir: (i: number) => void;
  tono: keyof typeof TONOS;
  /** aria-label del grupo de indicadores, p. ej. "Páginas del CV". */
  etiqueta: string;
  className?: string;
}

export function ControlesPaginas({
  total,
  pagina,
  onIr,
  onElegir,
  tono,
  etiqueta,
  className = '',
}: ControlesPaginasProps) {
  const t = TONOS[tono];
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <button type="button" onClick={() => onIr(-1)} aria-label="Página anterior" className={t.flecha}>
        ‹
      </button>

      <div role="tablist" aria-label={etiqueta} className="flex flex-wrap gap-2">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === pagina}
            aria-label={`Página ${i + 1}`}
            onClick={() => onElegir(i)}
            className={`${t.punto} rounded-full border transition-colors ${
              i === pagina ? t.activo : t.inactivo
            }`}
          />
        ))}
      </div>

      <button type="button" onClick={() => onIr(1)} aria-label="Página siguiente" className={t.flecha}>
        ›
      </button>
    </div>
  );
}
