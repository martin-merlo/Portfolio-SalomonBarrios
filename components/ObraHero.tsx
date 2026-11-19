import Image from 'next/image';

/**
 * Hero de /obra/[slug]: una franja con la imagen de la obra que asoma arriba,
 * detrás de la ola del papel (pedido del artista: la página arranca ya tapada
 * por la hoja). El título va sobre el papel, en la página.
 *
 * Sticky + z-0 igual que el del home: PaperSurface (z-10, flujo normal) arranca
 * con el valle de la ola justo en el borde inferior de esta franja (su margen
 * negativo de -19.6% del ancho ya hace eso) y la termina de tapar al scrollear,
 * con el mismo truco puramente CSS.
 *
 * Alto: 31% de la pantalla (como la referencia del artista), con un mínimo de
 * 160px para que en pantallas muy bajas siga asomando algo de la obra debajo
 * del navbar (72px).
 *
 * SIN data-aberracion: en la página de obra la imagen se ve limpia (ver
 * AberracionCromatica). next/image con priority: es lo primero que se ve.
 */
export default function ObraHero({ imagenUrl }: { imagenUrl: string }) {
  return (
    <section
      id="obra-hero"
      data-protegida
      className="sticky top-0 z-0 w-full overflow-hidden bg-tinta h-[max(31vh,160px)]"
    >
      {imagenUrl && (
        <Image src={imagenUrl} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      )}
      <div className="absolute inset-0 bg-tinta/45" aria-hidden="true" />
    </section>
  );
}
