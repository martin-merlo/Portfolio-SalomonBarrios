import type { ContenidoSitio } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';

export default function Hero({ contenido }: { contenido: ContenidoSitio }) {
  return (
    <section
      id="hero"
      className="sticky top-0 z-0 w-full overflow-hidden bg-tinta"
      style={{
        height: 'calc(100vh - 100px)',
        backgroundImage: fondoImagen(contenido.heroImagenUrl),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Velo oscuro azulado */}
      <div className="absolute inset-0 bg-tinta/45" aria-hidden="true" />

      <div className="relative z-10 h-full max-w-[1500px] mx-auto px-5 sm:px-10 lg:px-14 pt-16 md:pt-0 flex flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        {/*
          lg:pl-36/xl:pl-48 acá son a propósito, no relleno cosmético: el
          Navbar mide en vivo la distancia entre este título y su slot en
          el navbar (que vive con su propio inset, mucho más ajustado:
          px-3/8/12) para animar el "vuelo" del título al anclarse. Sin este
          inset extra, en anchos de escritorio comunes (~1280–1536px) el
          padding del hero y el del navbar casi coinciden y el desplazamiento
          horizontal medido queda en unos pocos píxeles contra ~350px de
          desplazamiento vertical — la trayectoria se ve prácticamente
          recta hacia arriba en vez de diagonal hacia arriba-izquierda como
          en diseño.pdf. (Antes lg:pl-24/xl:pl-32 — muy poco diagonal — se
          dobló a lg:pl-48/xl:pl-64 — diagonal muy marcada pero título
          quedaba centrado — luego se recortó a lg:pl-36/xl:pl-48, y ahora a
          lg:pl-32/xl:pl-44 para arrancar un paso más a la izquierda. Medido a
          1280x800 el ratio |deltaX|/|deltaY| del anclaje pasa de ~0.69 a
          ~0.63 en xl y de ~0.52 a ~0.47 en lg: la diagonal sigue claramente
          marcada. Un paso más — lg:pl-28/xl:pl-40 — la aplanaría a ~0.41/~0.58
          y no vale la pena; este es el punto razonable más a la izquierda.)
          Sigue siendo solo un mayor punto de partida — el deltaX
          real lo sigue midiendo Navbar en vivo, así que el aterrizaje sigue
          coincidiendo exacto con el slot del navbar sin importar este
          valor. Este inset solo se nota en desktop (lg:+): mobile usa
          crossfade en vez de mover el título, así que no lo necesita.
        */}
        <div className="lg:pl-32 xl:pl-44">
          {/*
            text-[12vw] en vez de 15vw: medido en vivo, "SALOMÓN BARRIOS" con
            15vw se salía del viewport por ~45px en 360/390px (el hero recorta
            con overflow-hidden, así que no se veía un scrollbar horizontal,
            se veía directamente la palabra cortada). La medición se hizo con
            el fallback real que Next genera para Sekuya ("sekuya Fallback",
            aproximado a Arial Black) porque el archivo de la fuente todavía
            no está — ver public/fonts/README.md — que es justo el escenario
            más ancho que hay que cubrir. 12vw entra con margen en 320–639px;
            sm/md/lg quedan iguales (no hacía falta tocarlos, no se cortaban).
            break-words como red de seguridad si algún título más largo
            entrara por el panel.
          */}
          <h1
            id="hero-title"
            className="font-display uppercase text-claro leading-[0.92] break-words text-[12vw] sm:text-[10vw] md:text-[6.2vw] lg:text-[5.4vw]"
            style={{ transformOrigin: 'left center', position: 'relative' }}
          >
            {contenido.heroTitulo}
          </h1>
          <p id="hero-sub" className="font-mono text-claro/90 mt-4 sm:mt-6 text-sm sm:text-base">
            {contenido.heroSubtitulo}
          </p>
        </div>

        {/* Alineado a la izquierda (pedido del artista, diseño original) y
            agrandado — antes text-sm/base y text-xs/sm, quedaba chico.
            md:mr-*: corrido un poco del borde derecho (referencia de diseño
            original, centro-derecha en vez de pegado al borde).
            id="hero-declaracion": el Navbar lo desvanece con el scroll con el
            MISMO tween que al subtítulo del nombre (#hero-sub), para que el
            bloque completo (título + texto) se funda parejo con él. */}
        <div id="hero-declaracion" className="max-w-sm md:mt-2 md:mr-6 lg:mr-14 xl:mr-20">
          <h2 className="font-mono uppercase tracking-wide text-claro text-base sm:text-lg lg:text-xl mb-3">
            {contenido.declaracionTitulo}
          </h2>
          <p className="font-mono text-claro/85 text-sm sm:text-base lg:text-lg leading-relaxed text-left">
            {contenido.declaracionTexto}
          </p>
        </div>
      </div>
    </section>
  );
}
