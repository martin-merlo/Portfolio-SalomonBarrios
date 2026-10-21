import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBloquesDeObra, getContenido, getObraBySlug } from '@/lib/datos';
import NavbarObra from '@/components/NavbarObra';
import ObraHero from '@/components/ObraHero';
import PaperSurface from '@/components/PaperSurface';
import SectionLabel from '@/components/SectionLabel';
import BloquesObra from '@/components/BloquesObra';
import { MARGEN_PAPEL } from '@/lib/estilos';
import { getIdioma } from '@/lib/idioma';
import { localizarBloque, localizarObra } from '@/lib/i18n';

// Se renderiza por request: el idioma (toggle ES/EN, misma URL) sale de una
// cookie o del navegador del visitante — ver lib/idioma.ts.

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [obraEs, idioma] = await Promise.all([getObraBySlug(slug), getIdioma()]);
  if (!obraEs) return {};
  const obra = localizarObra(obraEs, idioma);

  return {
    title: `${obra.titulo} — Salomón Barrios`,
    description: obra.descripcion,
  };
}

export default async function ObraPage({ params }: Params) {
  const { slug } = await params;
  const idioma = await getIdioma();
  const [obraEs, contenido] = await Promise.all([getObraBySlug(slug), getContenido(idioma)]);

  if (!obraEs) notFound();

  const obra = localizarObra(obraEs, idioma);
  const bloques = (await getBloquesDeObra(obra.id)).map((b) => localizarBloque(b, idioma));

  // Sección de contenido extendido = subtítulo (encabezado) + bloques. Si no hay
  // ni subtítulo ni bloques, la página termina en el hero, sin dejar un vacío.
  const tieneContenidoExtra = Boolean(obra.subtituloExtendido) || bloques.length > 0;

  return (
    <>
      <NavbarObra nombreArtista={contenido.heroTitulo} idioma={idioma} />
      <main>
        <ObraHero titulo={obra.titulo} imagenUrl={obra.imagenUrl} descripcion={obra.descripcion} idioma={idioma} />

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
                <BloquesObra bloques={bloques} idioma={idioma} />
              </div>
            </section>
          </PaperSurface>
        )}
      </main>
    </>
  );
}
