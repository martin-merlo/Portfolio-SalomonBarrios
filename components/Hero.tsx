import type { ContenidoSitio } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';

export default function Hero({ contenido }: { contenido: ContenidoSitio }) {
  return (
    <section
      id="hero"
      className="sticky top-0 z-0 w-full overflow-hidden bg-tinta"
      style={{
        height: 'calc(100vh - 48px)',
        backgroundImage: fondoImagen(contenido.heroImagenUrl),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Velo oscuro azulado */}
      <div className="absolute inset-0 bg-tinta/45" aria-hidden="true" />

      <div className="relative z-10 h-full max-w-[1500px] mx-auto px-5 sm:px-10 lg:px-14 pt-16 md:pt-0 flex flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        {/*
          lg:pl-48/xl:pl-64 acá son a propósito, no relleno cosmético: el
          Navbar mide en vivo la distancia entre este título y su slot en
          el navbar (que vive con su propio inset, mucho más ajustado:
          px-3/8/12) para animar el "vuelo" del título al anclarse. Sin este
          inset extra, en anchos de escritorio comunes (~1280–1536px) el
          padding del hero y el del navbar casi coinciden y el desplazamiento
          horizontal medido queda en unos pocos píxeles contra ~350px de
          desplazamiento vertical — la trayectoria se ve prácticamente
          recta hacia arriba en vez de diagonal hacia arriba-izquierda como
          en diseño.pdf. El valor se duplicó (antes lg:pl-24/xl:pl-32) a
          pedido del artista, que quería el rincón de llegada arriba-izquierda
          claramente legible en vez de una diagonal apenas perceptible; sigue
          siendo solo un mayor punto de partida — el deltaX real lo sigue
          midiendo Navbar en vivo, así que el aterrizaje sigue coincidiendo
          exacto con el slot del navbar. Este inset solo se nota en desktop
          (lg:+): mobile usa crossfade en vez de mover el título, así que no
          lo necesita.
        */}
        <div className="lg:pl-48 xl:pl-64">
          <h1
            id="hero-title"
            className="font-display uppercase text-claro leading-[0.92] text-[15vw] sm:text-[10vw] md:text-[6.2vw] lg:text-[5.4vw]"
            style={{ transformOrigin: 'left center', position: 'relative' }}
          >
            {contenido.heroTitulo}
          </h1>
          <p id="hero-sub" className="font-mono text-claro/90 mt-4 sm:mt-6 text-sm sm:text-base">
            {contenido.heroSubtitulo}
          </p>
        </div>

        <div className="max-w-sm md:mt-2 md:text-right">
          <h2 className="font-mono uppercase tracking-wide text-claro text-sm sm:text-base mb-3">
            {contenido.declaracionTitulo}
          </h2>
          <p className="font-mono text-claro/85 text-xs sm:text-sm leading-relaxed text-left md:text-right">
            {contenido.declaracionTexto}
          </p>
        </div>
      </div>
    </section>
  );
}
