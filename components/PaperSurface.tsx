import type { ReactNode } from 'react';
import OlaPapel from './OlaPapel';
import BordeOrnamental from './BordeOrnamental';

/**
 * El papel que tapa la obra del hero al scrollear. Sin JavaScript: el hero
 * (sticky, z-0) queda fijo detrás mientras este bloque (z-10, en flujo
 * normal) sube por encima con su borde ondulado.
 *
 * La textura de papel vive en un wrapper interno que arranca DESPUÉS de
 * OlaPapel, no en este contenedor raíz. Si el fondo de la textura pintara
 * detrás de OlaPapel, el recorte de la máscara no tendría ningún efecto
 * visible: enmascarar un elemento no revela el hero si lo que hay pintado
 * justo detrás (el fondo propio de este mismo contenedor) es otra
 * superficie de papel casi idéntica a la que la máscara recorta. Con el
 * contenedor raíz transparente, la zona enmascarada de OlaPapel deja ver
 * de verdad al hero (z-0) por debajo.
 *
 * BordeOrnamental vive DENTRO del wrapper de la textura (después de su
 * propio fondo, antes que {children}), no como sibling de este div ni
 * global en page.tsx — dos motivos, uno de posición y uno de stacking:
 *   1. Posición: así queda acotado exactamente al alto de la textura de
 *      papel, que arranca recién después de OlaPapel — nunca se renderiza
 *      sobre el hero ni sobre la costura hero-papel.
 *   2. Stacking (el bug real que hubo acá): BordeOrnamental usa
 *      position:absolute, y este wrapper de la textura usa position:relative
 *      — los dos son "positioned" con z-index:auto. Cuando BordeOrnamental
 *      vivía COMO SIBLING antes de este wrapper, el orden de pintado de
 *      z-index:auto entre positioned siblings se decide por orden de
 *      documento, y este wrapper (que pinta DESPUÉS en el DOM) tapaba por
 *      completo al borde con su propio fondo opaco (bg-papel + textura) en
 *      toda su altura — el borde solo se veía en la franja de arriba donde
 *      este wrapper todavía no había empezado, exactamente la costura
 *      hero-papel, que es justo donde NO debía verse, y nunca en las
 *      secciones reales (bio/work/cv), que es justo donde SÍ debía verse.
 *      Moviéndolo adentro, después del propio fondo de este wrapper pero
 *      antes que {children}, pinta arriba de la textura y abajo del
 *      contenido real — cualquier sección con fondo opaco que venga después
 *      (las cards del work, por ejemplo) lo sigue tapando, como corresponde.
 *
 * overflow-clip en el contenedor raíz es necesario, no cosmético:
 * BordeOrnamental traslada (translateY, ligado al scroll) una tira
 * position:absolute inset-y-0. Aunque esa tira recorta su propio contenido
 * con overflow-hidden, el navegador de todos modos suma la posición ya
 * trasladada de la tira al scrollable-overflow de sus ancestros en cuanto
 * ninguno de ellos recorta — y ni <body> ni <main> lo hacen. Sin este
 * overflow-clip, cada pixel de scroll agrega ~0.5px de alto fantasma al
 * documento (crecía sin límite mientras el usuario scrolleaba), dejando
 * una franja en blanco después de la firma. Verificado en vivo: sin este
 * recorte, document.scrollingElement.scrollHeight seguía creciendo con el
 * scroll; con él, se mantiene fijo apenas termina de asentar el contenido.
 */
export default function PaperSurface({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 overflow-clip">
      <OlaPapel />
      <div
        className="relative bg-papel"
        style={{
          backgroundImage: 'url(/imagenes/textura-papel.webp)',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
        }}
      >
        <BordeOrnamental />
        {children}
      </div>
    </div>
  );
}
