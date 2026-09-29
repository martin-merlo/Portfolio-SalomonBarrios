'use client';

import { MARGEN_PAPEL } from '@/lib/estilos';
import { usePaginacion } from '@/lib/usePaginacion';
import SectionLabel from './SectionLabel';
import { ControlesPaginas, PistaPaginas } from './Paginacion';

const CLASE_TEXTO_PAGINA = 'font-cuerpo text-sm sm:text-base leading-relaxed pr-2 sm:pr-6';

export default function Cav({ texto }: { texto: string }) {
  const { contenedorRef, paginas, pagina, setPagina, ir, total } = usePaginacion(
    texto,
    CLASE_TEXTO_PAGINA,
  );

  return (
    <section id="cav" className={`${MARGEN_PAPEL} pb-20 sm:pb-28`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="CV.3" />

        {/*
         * Cuadro de color sólido (#F2F0EF, token recuadro) detrás del texto,
         * ajustado al bloque con padding — reemplaza a la capa soft-light. Va en
         * un wrapper EXTERIOR a propósito: la paginación mide la caja de
         * PistaPaginas como el espacio disponible de cada página, así que el
         * padding no puede ir en ese mismo div (las páginas quedarían más chicas
         * que lo medido y el texto se desbordaría).
         */}
        <div className="bg-recuadro px-4 py-4 sm:px-7 sm:py-6">
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
