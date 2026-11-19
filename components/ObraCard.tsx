import { textos, type Idioma } from '@/lib/i18n';
import Image from 'next/image';
import Link from 'next/link';
import type { Obra, TamanoGrilla } from '@/lib/tipos';
import styles from './ObraCard.module.css';

const SPAN: Record<TamanoGrilla, string> = {
  normal: 'col-span-12 md:col-span-4 aspect-square',
  banner: 'col-span-12 aspect-[3/1]',
  // Chica: mobile-first, 2 por fila hasta tablet (col-span-6) y 4 por fila en
  // desktop (lg:col-span-3 = 3/12). Más apaisada/finita que antes: 4/1 en
  // desktop; en mobile/tablet la card es más angosta, así que un 4/1 quedaría
  // ilegible → usamos 5/2 (más alta) para que el título siga entrando.
  // normal y banner sin tocar.
  chica: 'col-span-6 lg:col-span-3 aspect-[5/2] lg:aspect-[4/1]',
};

// Ancho que ocupa la card según SPAN (la grilla tiene tope de 1500px), para que
// next/image entregue la imagen a ese tamaño y no el archivo original.
const SIZES: Record<TamanoGrilla, string> = {
  normal: '(min-width: 1500px) 500px, (min-width: 768px) 33vw, 100vw',
  banner: '(min-width: 1500px) 1500px, 100vw',
  chica: '(min-width: 1500px) 375px, (min-width: 1024px) 25vw, 50vw',
};

/**
 * Si la obra tiene página propia, la card navega a /obra/[slug] (cursor
 * pointer). Si no, es puramente informativa: sin cursor de interacción y sin
 * ninguna acción de click.
 */
export default function ObraCard({ obra, idioma }: { obra: Obra; idioma: Idioma }) {
  const conHover = obra.tieneHover && !!obra.imagenHoverUrl;
  const clickeable = obra.tienePaginaPropia;
  const etiqueta = `${obra.titulo}${obra.tecnica ? `, ${obra.tecnica}` : ''}${obra.anio ? `, ${obra.anio}` : ''}`;

  const className = `${styles.card} group relative overflow-hidden shadow-sutil ${SPAN[obra.tamanoGrilla]} ${
    clickeable ? 'cursor-pointer' : 'cursor-default'
  }`;

  const contenido = (
    <>
      {/* Las imágenes (base y la que entra al hover) van en un wrapper propio
          con data-aberracion (ver AberracionCromatica): el filtro no puede ir
          en la imagen base, que ya usa `filter` para el brillo del hover, y la
          descripción/título quedan afuera — nada de aberración sobre texto.
          next/image (fill + object-cover, el mismo encuadre que el fondo CSS de
          antes) entrega cada imagen al ancho de la card y difiere las que están
          fuera de pantalla; antes se bajaban los originales completos (hasta
          2500px) apenas se abría la página. alt vacío: el nombre accesible lo
          da la card. */}
      <div data-aberracion="imagen" data-protegida className="absolute inset-0">
        <Image
          src={obra.imagenUrl}
          alt=""
          fill
          sizes={SIZES[obra.tamanoGrilla]}
          className={`object-cover object-center ${!conHover ? styles.brillo : ''}`}
        />
        {conHover && (
          <Image
            src={obra.imagenHoverUrl!}
            alt=""
            aria-hidden="true"
            fill
            sizes={SIZES[obra.tamanoGrilla]}
            className={`${styles.hoverSlide} object-cover object-center`}
          />
        )}
      </div>

      {conHover && (
        <>
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

      <div aria-hidden="true" className={`absolute inset-0 ${styles.veloTitulo}`} />

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
      <Link href={`/obra/${obra.slug}`} aria-label={`${textos(idioma).verObra} ${etiqueta}`} className={className}>
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
