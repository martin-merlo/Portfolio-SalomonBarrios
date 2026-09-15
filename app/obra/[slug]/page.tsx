import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContenido, getObraBySlug } from '@/lib/datos';
import NavbarObra from '@/components/NavbarObra';
import ObraHero from '@/components/ObraHero';
import PaperSurface from '@/components/PaperSurface';
import SectionLabel from '@/components/SectionLabel';
import CarruselObra from '@/components/CarruselObra';

// El artista va a estar editando obras desde el panel más adelante — no hace
// falta que el contenido sea instantáneo, así que revalidamos cada 60s.
export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const obra = await getObraBySlug(slug);
  if (!obra) return {};

  return {
    title: `${obra.titulo} — Salomón Barrios`,
    description: obra.descripcion,
  };
}

export default async function ObraPage({ params }: Params) {
  const { slug } = await params;
  const [obra, contenido] = await Promise.all([getObraBySlug(slug), getContenido()]);

  if (!obra) notFound();

  return (
    <>
      <NavbarObra nombreArtista={contenido.heroTitulo} />
      <main>
        <ObraHero titulo={obra.titulo} imagenUrl={obra.imagenUrl} descripcion={obra.descripcion} />

        {/*
          PaperSurface se renderiza SIEMPRE (antes solo si había contenido
          extendido) para que la subpágina tenga el mismo marco que el home:
          textura de papel + borde ornamental, que viven dentro de este
          componente compartido. min-h asegura que el papel sea lo bastante
          alto como para que el borde y la textura se lean como marco (y para
          que el papel suba sobre el hero al scrollear) incluso cuando la obra
          todavía no tiene subtítulo/texto/galería cargados. El contenido
          extendido sigue siendo condicional — no se inventan secciones.
        */}
        <PaperSurface>
          <section className="px-5 sm:px-10 lg:px-14 pt-20 sm:pt-28 pb-20 sm:pb-28 min-h-[70vh]">
            <div className="max-w-[1500px] mx-auto">
              {obra.subtituloExtendido && <SectionLabel texto={obra.subtituloExtendido} />}

              {obra.textoExtendido && (
                <div className="font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4 mb-12">
                  {obra.textoExtendido.split('\n\n').map((parrafo, i) => (
                    <p key={i}>{parrafo}</p>
                  ))}
                </div>
              )}

              {obra.imagenes.length > 0 && <CarruselObra imagenes={obra.imagenes} />}
            </div>
          </section>
        </PaperSurface>
      </main>
    </>
  );
}
