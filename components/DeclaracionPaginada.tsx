'use client';

import { usePaginacion } from '@/lib/usePaginacion';
import { ControlesPaginas, PistaPaginas } from './Paginacion';

// Misma tipografía que tenía el párrafo de la declaración.
const CLASE_TEXTO = 'font-mono text-claro/85 text-sm sm:text-base lg:text-lg leading-relaxed text-left';

/**
 * Declaración del artista (bloque a la derecha del hero), paginada
 * automáticamente con el mismo mecanismo que el CV: el texto se corta según lo
 * que entra en la caja (alto relativo al viewport, porque el hero mide
 * 100vh − 100px), sin partir palabras, en tantas páginas como haga falta.
 *
 * Tres cosas a no romper:
 *  - id="hero-declaracion" va en el div raíz y ese div NO lleva prop `style`:
 *    el Navbar lo desvanece con GSAP escribiendo estilos inline, y React no los
 *    pisa mientras no tenga un style propio.
 *  - La capa de contenido del hero es pointer-events-none (para no bloquear
 *    clicks de las secciones que pasan por debajo); por eso los controles
 *    llevan pointer-events-auto. Cuando el bloque termina de desvanecerse el
 *    Navbar le pone visibility:hidden (autoAlpha), así esos botones invisibles
 *    no siguen capturando clicks sobre el papel.
 *  - Con una sola página no se muestran controles.
 */
export default function DeclaracionPaginada({ titulo, texto }: { titulo: string; texto: string }) {
  const { contenedorRef, paginas, pagina, setPagina, ir, total } = usePaginacion(texto, CLASE_TEXTO);

  return (
    <div id="hero-declaracion" className="w-full max-w-sm md:mt-2 md:mr-6 lg:mr-14 xl:mr-20">
      <h2 className="font-mono uppercase tracking-wide text-claro text-base sm:text-lg lg:text-xl mb-3">
        {titulo}
      </h2>

      <PistaPaginas
        contenedorRef={contenedorRef}
        paginas={paginas}
        pagina={pagina}
        clase={CLASE_TEXTO}
        alto="h-[24vh] md:h-[40vh]"
      />

      {total > 1 && (
        <ControlesPaginas
          total={total}
          pagina={pagina}
          onIr={ir}
          onElegir={setPagina}
          tono="claro"
          etiqueta="Páginas de la declaración del artista"
          className="mt-4 pointer-events-auto"
        />
      )}
    </div>
  );
}
