import { MARGEN_PAPEL } from '@/lib/estilos';
import { sanitizarHtmlRico } from '@/lib/sanitizarHtml';
import SectionLabel from './SectionLabel';

export default function Bio({ texto }: { texto: string }) {
  // HTML del editor del panel (o texto plano viejo, que se convierte a
  // párrafos), SIEMPRE sanitizado. Bio no pagina: el formato es libre.
  const html = sanitizarHtmlRico(texto);

  return (
    <section id="bio" className={`${MARGEN_PAPEL} pt-20 sm:pt-28 pb-16`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="bio.1" />
        {/*
         * Cuadro de color sólido (token recuadro = claro, #F7F6F2, con sombra sutil) detrás del bloque de
         * texto, ajustado al bloque con algo de padding: el texto se lee sobre un
         * fondo limpio en vez de directo sobre la textura de papel. Reemplaza a la
         * capa soft-light anterior. Tapa también el borde ornamental donde se
         * cruzan, así el texto nunca queda encima del dibujo. Para eso lleva
         * `relative`: el borde es un elemento posicionado (absolute) y, sin
         * posición propia, el cuadro se pintaba DEBAJO de él (orden de pintado
         * de CSS) — entre ~1024 y ~1700px el dibujo tapaba el final de las
         * líneas. Mismo criterio en el cuadro del CV y en los bloques de obra.
         */}
        <div
          className="texto-rico relative bg-recuadro shadow-sutil px-4 py-4 sm:px-7 sm:py-6 font-cuerpo text-tinta text-sm sm:text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
