import { MARGEN_PAPEL } from '@/lib/estilos';
import SectionLabel from './SectionLabel';

export default function Bio({ texto }: { texto: string }) {
  const parrafos = texto.split('\n\n');

  return (
    <section id="bio" className={`${MARGEN_PAPEL} pt-20 sm:pt-28 pb-16`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="bio.1" />
        {/*
         * Cuadro de color sólido (#F2F0EF, token recuadro) detrás del bloque de
         * texto, ajustado al bloque con algo de padding: el texto se lee sobre un
         * fondo limpio en vez de directo sobre la textura de papel. Reemplaza a la
         * capa soft-light anterior. Tapa también el borde ornamental donde se
         * cruzan, así el texto nunca queda encima del dibujo.
         */}
        <div className="bg-recuadro px-4 py-4 sm:px-7 sm:py-6 font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4">
          {parrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
