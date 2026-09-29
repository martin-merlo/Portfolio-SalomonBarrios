import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBloquesDeObra, getContenido, getObraBySlug } from '@/lib/datos';
import NavbarObra from '@/components/NavbarObra';
import ObraHero from '@/components/ObraHero';
import PaperSurface from '@/components/PaperSurface';
import SectionLabel from '@/components/SectionLabel';
import BloquesObra from '@/components/BloquesObra';
import { MARGEN_PAPEL } from '@/lib/estilos';

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

  const bloques = await getBloquesDeObra(obra.id);

  // Sección de contenido extendido = subtítulo (encabezado) + bloques. Si no hay
  // ni subtítulo ni bloques, la página termina en el hero, sin dejar un vacío.
  const tieneContenidoExtra = Boolean(obra.subtituloExtendido) || bloques.length > 0;

  return (
    <>
      <NavbarObra nombreArtista={contenido.heroTitulo} />
      <main>
        <ObraHero titulo={obra.titulo} imagenUrl={obra.imagenUrl} descripcion={obra.descripcion} />

        {/*
          PaperSurface sólo cuando hay contenido extendido, para que la subpágina
          tenga el marco del sitio (textura + borde ornamental) donde hay algo que
          mostrar. min-h asegura que el papel sea lo bastante alto como para subir
          sobre el hero al scrollear. El contenido libre son los bloques; arriba
          va el subtítulo como encabezado.
        */}
        {tieneContenidoExtra && (
          <PaperSurface>
            <section className={`${MARGEN_PAPEL} pt-20 sm:pt-28 pb-20 sm:pb-28 min-h-[70vh]`}>
              <div className="max-w-[1500px] mx-auto">
                {obra.subtituloExtendido && <SectionLabel texto={obra.subtituloExtendido} />}
                <BloquesObra bloques={bloques} />
              </div>
            </section>
          </PaperSurface>
        )}
      </main>
    </>
  );
}
