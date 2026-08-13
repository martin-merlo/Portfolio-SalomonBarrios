/**
 * Borde ondulado del papel que tapa al hero. Asset real del artista
 * (public/imagenes/forma-recorte.png, canal alfa) usado como máscara CSS
 * en vez del path SVG aproximado anterior. mask-size: 100% auto escala la
 * imagen por ancho; el contenedor solo muestra su porción superior (donde
 * está la curva — el resto de los 694px de alto del asset es relleno
 * opaco sin más información), asegurando que la curva completa entre
 * siempre dentro de la caja sin importar el ancho de pantalla.
 */
export default function OlaPapel() {
  return (
    <div
      aria-hidden="true"
      className="block w-full"
      style={{
        aspectRatio: '1281 / 310',
        backgroundColor: 'var(--color-papel)',
        backgroundImage: "url('/imagenes/textura-papel.webp')",
        backgroundPosition: 'top center',
        backgroundRepeat: 'repeat-y',
        maskImage: "url('/imagenes/forma-recorte.png')",
        WebkitMaskImage: "url('/imagenes/forma-recorte.png')",
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'top',
        WebkitMaskPosition: 'top',
        maskSize: '100% auto',
        WebkitMaskSize: '100% auto',
      }}
    />
  );
}
