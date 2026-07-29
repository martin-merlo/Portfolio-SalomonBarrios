import type { Obra, TamanoGrilla } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';
import styles from './ObraCard.module.css';

const SPAN: Record<TamanoGrilla, string> = {
  normal: 'col-span-12 md:col-span-4 aspect-square',
  banner: 'col-span-12 aspect-[3/1]',
  chica: 'col-span-6 md:col-span-3 aspect-[2/1]',
};

export default function ObraCard({ obra, onAbrir }: { obra: Obra; onAbrir: () => void }) {
  const conHover = obra.tieneHover && !!obra.imagenHoverUrl;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAbrir();
        }
      }}
      aria-label={`Ver obra ${obra.titulo}, ${obra.tecnica}, ${obra.anio}`}
      className={`${styles.card} group relative overflow-hidden ${SPAN[obra.tamanoGrilla]}`}
    >
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
    </div>
  );
}
