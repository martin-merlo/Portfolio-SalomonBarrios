import { Suspense } from 'react';
import { getContenido, getObras, getProceso } from '@/lib/datos';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import PaperSurface from '@/components/PaperSurface';
import Bio from '@/components/Bio';
import Work from '@/components/Work';
import Cav from '@/components/Cav';
import Proceso from '@/components/Proceso';
import Contacto from '@/components/Contacto';

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
          <Bio texto={contenido.bioTexto} />
          <Suspense fallback={null}>
            <Work obras={obras} />
          </Suspense>
          <Cav texto={contenido.cvTexto} />
          <Proceso items={proceso} />
          <Contacto contenido={contenido} />
        </PaperSurface>
      </main>
    </>
  );
}
