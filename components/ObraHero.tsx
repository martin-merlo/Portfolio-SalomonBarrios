import { fondoImagen } from '@/lib/imagen';

/**
 * Hero de /obra/[slug] — mismo tratamiento visual que el Hero del home
 * (velo oscuro, tipografía Sekuya para el título grande). Sticky + z-0 igual
 * que el del home: si más abajo hay contenido extendido envuelto en
 * PaperSurface (z-10, flujo normal), lo cubre al scrollear con el mismo
 * truco puramente CSS. Si no hay nada debajo, el hero ocupa la pantalla y
 * listo — sin ningún hueco extra.
 */
export default function ObraHero({
  titulo,
  imagenUrl,
  descripcion,
}: {
  titulo: string;
  imagenUrl: string;
  descripcion: string;
}) {
  return (
    <section
      id="obra-hero"
      className="sticky top-0 z-0 w-full overflow-hidden bg-tinta"
      style={{
        height: 'calc(100vh - 48px)',
        backgroundImage: fondoImagen(imagenUrl),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-tinta/45" aria-hidden="true" />

      <div className="relative z-10 h-full max-w-[1500px] mx-auto px-5 sm:px-10 lg:px-14 pt-16 md:pt-0 flex flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
        <div>
          {/* text-[12vw], no 15vw: ver la misma nota en Hero.tsx — con 15vw un
              título largo se sale del viewport en 360/390px. */}
          <h1 className="font-display uppercase text-claro leading-[0.92] break-words text-[12vw] sm:text-[10vw] md:text-[6.2vw] lg:text-[5.4vw]">
            {titulo}
          </h1>
        </div>

        <div className="max-w-sm md:mt-2 md:text-right">
          <h2 className="font-mono uppercase tracking-wide text-claro text-sm sm:text-base mb-3">
            Sobre la obra
          </h2>
          <p className="font-mono text-claro/85 text-xs sm:text-sm leading-relaxed text-left md:text-right">
            {descripcion}
          </p>
        </div>
      </div>
    </section>
  );
}
