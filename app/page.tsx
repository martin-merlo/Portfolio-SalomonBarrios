import { getContenido, getObras, getProceso } from '@/lib/datos';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import PaperSurface from '@/components/PaperSurface';
import Bio from '@/components/Bio';
import Work from '@/components/Work';
import Cav from '@/components/Cav';
import { sanitizarHtmlRico } from '@/lib/sanitizarHtml';
import Proceso from '@/components/Proceso';
import Contacto from '@/components/Contacto';

// El contenido lo edita el artista desde el panel — no hace falta que sea
// instantáneo, así que revalidamos cada 60s en vez de forzar dynamic total.
export const revalidate = 60;

export default async function Home() {
  const [contenido, obras, proceso] = await Promise.all([
    getContenido(),
    getObras(),
    getProceso(),
  ]);

  return (
    <>
      <Navbar heroTitulo={contenido.heroTitulo} />
      <main>
        <Hero contenido={contenido} />
        <PaperSurface>
          {/* Mismo orden que el navbar (BIO · WORK · CONTACTO · CV) y que la
              numeración de los labels (bio.1, work.2, Contacto.3, CV.4). El
              carrusel de proceso va pegado al CV, justo antes: sigue entre
              Contacto y CV como cuando el orden era CV → proceso → contacto,
              y el CV queda como cierre de la página. */}
          <Bio texto={contenido.bioTexto} />
          <Work obras={obras} />
          <Contacto contenido={contenido} />
          <Proceso items={proceso} />
          <Cav html={sanitizarHtmlRico(contenido.cvTexto)} />
        </PaperSurface>
      </main>
    </>
  );
}
