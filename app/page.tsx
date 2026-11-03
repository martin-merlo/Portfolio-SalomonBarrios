import { getContenido, getObras, getProceso } from '@/lib/datos';
import { getIdioma } from '@/lib/idioma';
import { localizarObra, localizarProceso } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import PaperSurface from '@/components/PaperSurface';
import Bio from '@/components/Bio';
import Work from '@/components/Work';
import Cav from '@/components/Cav';
import { sanitizarHtmlRico } from '@/lib/sanitizarHtml';
import Proceso from '@/components/Proceso';
import Contacto from '@/components/Contacto';

// Se renderiza por request: el idioma (toggle ES/EN, misma URL) sale de una
// cookie o del navegador del visitante — ver lib/idioma.ts.

export default async function Home() {
  const idioma = await getIdioma();
  const [contenido, obrasEs, procesoEs] = await Promise.all([
    getContenido(idioma),
    getObras(),
    getProceso(),
  ]);
  const obras = obrasEs.map((o) => localizarObra(o, idioma));
  const proceso = procesoEs.map((p) => localizarProceso(p, idioma));

  return (
    <>
      <Navbar heroTitulo={contenido.heroTitulo} idioma={idioma} />
      <main>
        <Hero contenido={contenido} idioma={idioma} />
        <PaperSurface>
          {/* Mismo orden que el navbar (BIO · WORK · CONTACTO · CV) y que la
              numeración de los labels (bio.1, work.2, Contacto.3, CV.4). El
              carrusel de proceso va pegado al CV, justo antes: sigue entre
              Contacto y CV como cuando el orden era CV → proceso → contacto,
              y el CV queda como cierre de la página. */}
          <Bio texto={contenido.bioTexto} foto={contenido} idioma={idioma} />
          <Work obras={obras} idioma={idioma} />
          <Contacto contenido={contenido} idioma={idioma} />
          <Proceso items={proceso} idioma={idioma} />
          <Cav html={sanitizarHtmlRico(contenido.cvTexto)} idioma={idioma} />
        </PaperSurface>
      </main>
    </>
  );
}
