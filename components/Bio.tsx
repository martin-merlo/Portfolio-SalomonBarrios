import SectionLabel from './SectionLabel';

export default function Bio({ texto }: { texto: string }) {
  const parrafos = texto.split('\n\n');

  return (
    <section id="bio" className="px-5 sm:px-10 lg:px-14 pt-20 sm:pt-28 pb-16">
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="bio.1" />
        <div className="relative">
          {/*
           * Capa soft-light detrás del bloque de texto (valor de InDesign
           * del artista): mismo color claro que el texto usa en otras
           * secciones, mix-blend-mode: soft-light al 100%, para levantar el
           * contraste del texto contra la textura de papel de PaperSurface.
           */}
          <div aria-hidden="true" className="absolute inset-0 bg-claro mix-blend-soft-light" />
          <div className="relative font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4">
            {parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
