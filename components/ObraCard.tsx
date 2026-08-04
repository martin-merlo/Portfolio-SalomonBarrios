import Link from 'next/link';
import type { Obra, TamanoGrilla } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';
import styles from './ObraCard.module.css';

const SPAN: Record<TamanoGrilla, string> = {
  normal: 'col-span-12 md:col-span-4 aspect-square',
  banner: 'col-span-12 aspect-[3/1]',
  chica: 'col-span-6 md:col-span-3 aspect-[2/1]',
};

/**
 * Si la obra tiene página propia, la card navega a /obra/[slug] (cursor
 * pointer). Si no, es puramente informativa: sin cursor de interacción y sin
 * ninguna acción de click.
 */
export default function ObraCard({ obra }: { obra: Obra }) {
  const conHover = obra.tieneHover && !!obra.imagenHoverUrl;
  const clickeable = obra.tienePaginaPropia;
  const etiqueta = `${obra.titulo}${obra.tecnica ? `, ${obra.tecnica}` : ''}${obra.anio ? `, ${obra.anio}` : ''}`;

  const className = `${styles.card} group relative overflow-hidden ${SPAN[obra.tamanoGrilla]} ${
    clickeable ? 'cursor-pointer' : 'cursor-default'
  }`;

  const contenido = (
    <>
      <div
        className={`absolute inset-0 bg-cover bg-center ${!conHover ? styles.brillo : ''}`}
        style={{ backgroundImage: fondoImagen(obra.imagenUrl) }}
      />

      {conHover && (
        <>
          <div
            aria-hidden="true"
            className={`${styles.hoverSlide} absolute inset-0 bg-cover bg-center`}
            style={{ backgroundImage: fondoImagen(obra.imagenHoverUrl!) }}
          />
          <div
            aria-hidden="true"
            className={`${styles.hoverOverlay} absolute inset-0 flex items-end bg-tinta/25`}
          >
            <p className="font-mono text-claro text-xs sm:text-sm leading-relaxed px-5 sm:px-7 pt-6 pb-12 sm:pb-14">
              {obra.descripcion}
            </p>
          </div>
        </>
      )}

      <span
        className={`absolute bottom-3 left-4 sm:bottom-4 sm:left-5 z-10 font-mono text-claro text-sm sm:text-base ${
          !conHover ? styles.subrayado : ''
        }`}
      >
        {obra.titulo}
      </span>
    </>
  );

  if (clickeable) {
    return (
      <Link href={`/obra/${obra.slug}`} aria-label={`Ver obra ${etiqueta}`} className={className}>
        {contenido}
      </Link>
    );
  }

  return (
    <div aria-label={etiqueta} className={className}>
      {contenido}
    </div>
  );
}
