import SectionLabel from './SectionLabel';

export default function Bio({ texto }: { texto: string }) {
  const parrafos = texto.split('\n\n');

  return (
    <section id="bio" className="px-5 sm:px-10 lg:px-14 pt-20 sm:pt-28 pb-16">
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="bio.1" />
        <div className="font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
