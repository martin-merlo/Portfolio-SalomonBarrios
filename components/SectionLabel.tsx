'use client';

import { useRouter } from 'next/navigation';

interface SectionLabelProps {
  texto: string;
  /**
   * Punto de entrada oculto al panel: sólo Contacto.tsx (Contactame.4) lo
   * pasa en true. El "~" sigue viéndose exactamente igual — un botón, no un
   * <a> (nada de href rastreable), con el área clickeable ampliada vía
   * padding + margen negativo para no mover el layout ni cambiar cómo se ve.
   */
  entradaPanel?: boolean;
}

export default function SectionLabel({ texto, entradaPanel = false }: SectionLabelProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 font-subtitulo text-tinta text-lg sm:text-xl mb-8 sm:mb-10">
      <span>{texto}</span>
      <span
        aria-hidden="true"
        className="flex-1 border-t-2 border-dotted border-tinta/40 translate-y-[3px]"
      />
      {entradaPanel ? (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => router.push('/panel/login')}
          className="relative inline-flex items-center justify-center p-[13px] -m-[13px]"
        >
          ~
        </button>
      ) : (
        <span aria-hidden="true">~</span>
      )}
    </div>
  );
}
