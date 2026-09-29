'use client';

import { useRef } from 'react';
import { MARGEN_PAPEL } from '@/lib/estilos';
import { usePaginacion } from '@/lib/usePaginacion';
import { useRuedaPaginas } from '@/lib/useRuedaPaginas';
import SectionLabel from './SectionLabel';
import { ControlesPaginas, PistaPaginas } from './Paginacion';

// texto-rico: formato del editor (negrita, listas, links); texto-rico--lineas:
// separa párrafos con una línea en blanco, como el texto plano de antes.
const CLASE_TEXTO_PAGINA =
  'texto-rico texto-rico--lineas font-cuerpo text-tinta text-sm sm:text-base leading-relaxed pr-2 sm:pr-6';

/** `html`: el CV ya sanitizado (lo sanitiza app/page.tsx, server component). */
export default function Cav({ html }: { html: string }) {
  const { contenedorRef, paginas, pagina, setPagina, ir, total } = usePaginacion(
    html,
    CLASE_TEXTO_PAGINA,
  );
  // Rueda del mouse encima del cuadro = pasar páginas (sin atrapar el scroll
  // en la primera/última página; ver useRuedaPaginas).
  const cajaRef = useRef<HTMLDivElement>(null);
  useRuedaPaginas(cajaRef, pagina, total, setPagina);

  return (
    <section id="cav" className={`${MARGEN_PAPEL} pb-20 sm:pb-28`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="CV.3" />

        {/*
         * Cuadro de color sólido (token recuadro = claro, #F7F6F2, con sombra sutil) detrás del texto,
         * ajustado al bloque con padding — reemplaza a la capa soft-light. Va en
         * un wrapper EXTERIOR a propósito: la paginación mide la caja de
         * PistaPaginas como el espacio disponible de cada página, así que el
         * padding no puede ir en ese mismo div (las páginas quedarían más chicas
         * que lo medido y el texto se desbordaría). `relative`: queda por
         * encima del borde ornamental (ver Bio.tsx).
         */}
        <div ref={cajaRef} className="relative bg-recuadro shadow-sutil px-4 py-4 sm:px-7 sm:py-6">
          <PistaPaginas
            contenedorRef={contenedorRef}
            paginas={paginas}
            pagina={pagina}
            clase={CLASE_TEXTO_PAGINA}
            alto="h-[360px] sm:h-[420px] lg:h-[460px]"
          />
        </div>

        <ControlesPaginas
          total={total}
          pagina={pagina}
          onIr={ir}
          onElegir={setPagina}
          tono="tinta"
          etiqueta="Páginas del CV"
          className="justify-center mt-8"
        />
      </div>
    </section>
  );
}
