import Image from 'next/image';
import { textos, type Idioma } from '@/lib/i18n';
import { MARGEN_PAPEL } from '@/lib/estilos';
import { sanitizarHtmlRico } from '@/lib/sanitizarHtml';
import type { ContenidoSitio } from '@/lib/tipos';
import FotoBioSinMedidas from './FotoBioSinMedidas';
import SectionLabel from './SectionLabel';

type FotoBio = Pick<ContenidoSitio, 'bioImagenUrl' | 'bioImagenAncho' | 'bioImagenAlto' | 'bioImagenAlt'>;

export default function Bio({ texto, foto, idioma }: { texto: string; foto: FotoBio; idioma: Idioma }) {
  // HTML del editor del panel (o texto plano viejo, que se convierte a
  // párrafos), SIEMPRE sanitizado. Bio no pagina: el formato es libre.
  const html = sanitizarHtmlRico(texto);
  const ancho = Number(foto.bioImagenAncho);
  const alto = Number(foto.bioImagenAlto);

  return (
    <section id="bio" className={`${MARGEN_PAPEL} pt-20 sm:pt-28 pb-16`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto={textos(idioma).labels.bio} />
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
        <div className="relative bg-recuadro shadow-sutil px-4 py-4 sm:px-7 sm:py-6">
          <div
            className="texto-rico font-cuerpo text-tinta text-sm sm:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {/* SIN data-aberracion a propósito: es un retrato, no una obra. Con las
              medidas guardadas se reserva el espacio y nada se corre cuando la
              imagen termina de cargar: ScrollTrigger ya calculó las secciones que
              siguen. El aspect-ratio explícito hace falta además de width/height:
              sin él, al cargar manda la proporción del archivo que entrega
              next/image, redondeada, y lo de abajo se corre una fracción de px
              (medido: hasta 0.27px). */}
          {foto.bioImagenUrl && (
            <div className="mt-6 sm:mt-8 mx-auto w-full max-w-[400px]">
              {ancho > 0 && alto > 0 ? (
                <Image
                  src={foto.bioImagenUrl}
                  alt={foto.bioImagenAlt}
                  width={ancho}
                  height={alto}
                  sizes="(max-width: 480px) 100vw, 400px"
                  className="block w-full h-auto"
                  style={{ aspectRatio: `${ancho} / ${alto}` }}
                />
              ) : (
                <FotoBioSinMedidas url={foto.bioImagenUrl} alt={foto.bioImagenAlt} />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
