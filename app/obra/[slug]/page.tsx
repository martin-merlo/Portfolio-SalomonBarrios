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

  // Contenido extendido = subtítulo (encabezado) + bloques; puede no haber nada.
  const tieneContenidoExtra = Boolean(obra.subtituloExtendido) || bloques.length > 0;

  return (
    <>
      <NavbarObra nombreArtista={contenido.heroTitulo} idioma={idioma} />
      <main>
        <ObraHero imagenUrl={obra.imagenUrl} />

        {/*
          La página arranca con el papel ya arriba (la obra asoma en la franja de
          ObraHero) y el título de la obra encabezándolo; debajo, el subtítulo y
          los bloques si los hay. Siempre con papel, también sin contenido
          extendido, para que todas las páginas de obra se vean igual.
          min-h: el papel llena justo la pantalla = 100vh − la franja de
          ObraHero − lo que la ola de OlaPapel baja de la franja (4.6vw). Una
          obra sin bloques entra entera en una pantalla, sin un scroll corto que
          no llega a tapar la franja; con bloques, el contenido manda.
        */}
        <PaperSurface>
          <section className={`${MARGEN_PAPEL} pt-4 sm:pt-2 pb-20 sm:pb-28 min-h-[calc(100vh_-_max(31vh,160px)_-_4.6vw)]`}>
            <div className="max-w-[1500px] mx-auto">
              {/* Sekuya como el título del home, en tinta sobre el papel. Tamaño
                  más contenido que el del hero del home: acá los títulos son
                  más largos ("… - Fotolibro") y break-words los parte si no
                  entran. Con la aberración de títulos (data-aberracion), igual
                  que antes en el hero de la obra. */}
              <h1
                data-aberracion="texto"
                className="font-display uppercase text-tinta text-center leading-[0.95] break-words text-[9vw] sm:text-[7vw] md:text-[4.4vw] lg:text-[3.6vw]"
              >
                {obra.titulo}
              </h1>
              {tieneContenidoExtra && (
                <div className="mt-12 sm:mt-16">
                  {obra.subtituloExtendido && <SectionLabel texto={obra.subtituloExtendido} />}
                  <BloquesObra bloques={bloques} idioma={idioma} />
                </div>
              )}
            </div>
          </section>
        </PaperSurface>
      </main>
    </>
  );
}
