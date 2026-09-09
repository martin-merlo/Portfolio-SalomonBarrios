'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ObraImagen } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';

/**
 * Carrusel deslizable de la galería de una obra (obra_imagenes) para la página
 * individual. A propósito NO depende del arrastre como única navegación (el
 * carrusel de Proceso tiene un bug conocido de drag): la navegación primaria
 * son las flechas, sobre un contenedor con scroll-snap. En touch se puede
 * deslizar con el dedo (scroll nativo), pero nunca es la única forma.
 */
export default function CarruselObra({ imagenes }: { imagenes: ObraImagen[] }) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const actualizarFlechas = useCallback(() => {
    const cont = pistaRef.current;
    if (!cont) return;
    const max = cont.scrollWidth - cont.clientWidth;
    setPuedeIzq(cont.scrollLeft > 1);
    setPuedeDer(cont.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    actualizarFlechas();
    const cont = pistaRef.current;
    if (!cont) return;
    cont.addEventListener('scroll', actualizarFlechas, { passive: true });
    window.addEventListener('resize', actualizarFlechas);
    return () => {
      cont.removeEventListener('scroll', actualizarFlechas);
      window.removeEventListener('resize', actualizarFlechas);
    };
  }, [actualizarFlechas]);

  function desplazar(direccion: -1 | 1) {
    const cont = pistaRef.current;
    if (!cont) return;
    const card = cont.querySelector<HTMLElement>('[data-card]');
    const gap = 24; // ~gap-6
    const paso = card ? card.offsetWidth + gap : cont.clientWidth * 0.8;
    cont.scrollBy({ left: direccion * paso, behavior: 'smooth' });
  }

  const hayVarias = imagenes.length > 1;

  return (
    <div className="relative">
      <div
        ref={pistaRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-proximity scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {imagenes.map((imagen) => (
          <div
            key={imagen.id}
            data-card
            className="snap-start shrink-0 w-64 sm:w-80 aspect-[4/3] bg-cover bg-center rounded-sm"
            style={{ backgroundImage: fondoImagen(imagen.imagenUrl) }}
          />
        ))}
      </div>

      {hayVarias && (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={() => desplazar(-1)}
            disabled={!puedeIzq}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-10 h-10 rounded-full bg-tinta/80 text-claro text-xl leading-none transition-opacity hover:bg-tinta disabled:opacity-0 disabled:pointer-events-none"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={() => desplazar(1)}
            disabled={!puedeDer}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-10 h-10 rounded-full bg-tinta/80 text-claro text-xl leading-none transition-opacity hover:bg-tinta disabled:opacity-0 disabled:pointer-events-none"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
