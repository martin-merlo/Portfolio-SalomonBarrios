'use client';

import { textos, type Idioma } from '@/lib/i18n';
import { usePaginacion } from '@/lib/usePaginacion';
import { ControlesPaginas, PistaPaginas } from './Paginacion';

// Caja de cada página.
// Desde md: 55vh, pero nunca más que 100vh − 340px — el hero mide 100vh −
// 100px y el bloque suma ~90px de título + controles; ese tope deja el bloque
// centrado sin meterse bajo el navbar (72px) en pantallas bajas.
// Mobile (< md): el bloque ocupa el alto que deja libre la columna del hero
// (flex-1, ver Hero.tsx), así se adapta al largo del subtítulo y al alto del
// teléfono sin pisar el toggle de idioma ni la ola del papel. La paginación
// mide la caja real, así que recorta en tantas páginas como haga falta.
// bajo: (apaisado de 480px de alto o menos, ver globals.css): el alto que queda
// en la columna = hero (100vh − 100px) − navbar (72px) − ola (4.3vw + 8px) −
// título del bloque (28px) − controles (40px). Mínimo de 3 líneas.
const ALTO_CAJA =
  'flex-1 min-h-[72px] md:flex-none md:h-[min(55vh,calc(100vh_-_340px))] bajo:flex-none bajo:min-h-[58px] bajo:h-[calc(100vh_-_248px_-_4.3vw)]';

// Tipografía del cuerpo de la declaración: 2px más chica que la original
// (12/14/16px, antes 14/16/18px) para que entre más texto por página. + formato
// del editor (texto-rico) con párrafos separados por una línea en blanco.
// bajo: 12px e interlineado normal en vez de relaxed: con la caja de ~100px de
// un celular apaisado entran 5 líneas por página en vez de 3 o 4.
const CLASE_TEXTO =
  'texto-rico texto-rico--lineas font-mono text-claro/85 text-xs sm:text-sm lg:text-base leading-relaxed bajo:text-xs bajo:leading-normal text-left';

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
 *  - Por lo mismo, los links del texto llevan pointer-events-auto
 *    ([&_a[href]]); el resto del texto sigue sin capturar clicks.
 *
 * Ancho: hasta 448px en md y 40vw (tope 640px) desde lg, para que entre bastante
 * texto por página. Si no hay lugar, el flex del hero angosta este bloque y el
 * del título (que no baja de su palabra más larga), manteniendo el gap-12 entre
 * ambos, y la paginación se recalcula con lo que quede. Hacen falta las dos
 * clases: md:flex-initial permite encogerse (con md:flex-none el bloque se salía
 * del hero por la derecha en tablet, recortado) y min-w-0 quita el piso del
 * min-width:auto, que sería el mínimo de la pista de páginas (todas en fila).
 */
/** `html`: la declaración ya sanitizada (la sanitiza Hero, server component). */
export default function DeclaracionPaginada({ titulo, html, idioma }: { titulo: string; html: string; idioma: Idioma }) {
  const { contenedorRef, paginas, pagina, setPagina, ir, total } = usePaginacion(html, CLASE_TEXTO);

  return (
    <div id="hero-declaracion" className="flex flex-1 min-h-0 flex-col md:block md:flex-initial w-full min-w-0 max-w-sm md:max-w-md lg:max-w-[min(40vw,640px)] md:mt-2 lg:mr-6 xl:mr-10 bajo:block bajo:flex-initial bajo:mt-0 [&_a[href]]:pointer-events-auto">
      <h2 className="font-mono uppercase tracking-wide text-claro text-base sm:text-lg lg:text-xl mb-3 bajo:text-sm bajo:mb-2">
        {titulo}
      </h2>

      <PistaPaginas
        contenedorRef={contenedorRef}
        paginas={paginas}
        pagina={pagina}
        clase={CLASE_TEXTO}
        alto={ALTO_CAJA}
      />

      {total > 1 && (
        <ControlesPaginas
          total={total}
          pagina={pagina}
          onIr={ir}
          onElegir={setPagina}
          tono="claro"
          etiqueta={textos(idioma).paginasDeclaracion}
          idioma={idioma}
          className="mt-4 bajo:mt-2 pointer-events-auto"
          contadorEnBajo
        />
      )}
    </div>
  );
}
