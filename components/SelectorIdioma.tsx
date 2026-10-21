'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { COOKIE_IDIOMA, IDIOMAS, textos, type Idioma } from '@/lib/i18n';

/**
 * Toggle ES | EN del navbar (píldora con el idioma activo resaltado). Guarda la
 * elección en una cookie (un año) y pide al servidor la página en el otro
 * idioma con router.refresh(): misma URL, sin recargar y sin perder el scroll.
 * Los textos que el artista cargó sin traducir siguen en español.
 */
export default function SelectorIdioma({ idioma, className = '' }: { idioma: Idioma; className?: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  function elegir(nuevo: Idioma) {
    if (nuevo === idioma || pendiente) return;
    document.cookie = `${COOKIE_IDIOMA}=${nuevo}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nuevo;
    iniciar(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={textos(idioma).idioma}
      className={`flex items-center gap-0.5 rounded-full border border-tinta/15 bg-claro p-0.5 shadow-sutil font-mono font-bold text-[11px] sm:text-xs leading-none transition-opacity ${
        pendiente ? 'opacity-70' : ''
      } ${className}`}
    >
      {IDIOMAS.map((op) => {
        const activo = op === idioma;
        return (
          <button
            key={op}
            type="button"
            lang={op}
            aria-pressed={activo}
            onClick={() => elegir(op)}
            className={`rounded-full px-2.5 py-1.5 uppercase tracking-wide transition-colors ${
              activo ? 'bg-tinta text-claro' : 'text-tinta/70 hover:text-tinta'
            }`}
          >
            {op}
          </button>
        );
      })}
    </div>
  );
}
