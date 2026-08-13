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
 * BordeOrnamental vive acá adentro (no global en page.tsx) para quedar
 * acotado exactamente a esta sección de fondo claro — nunca sobre el
 * hero — y va ANTES que {children} sin z-index propio para que cualquier
 * contenido opaco de las secciones (las cards del work, por ejemplo) lo
 * tape de verdad en vez de quedar por encima.
 *
 * overflow-clip acá es necesario, no cosmético: BordeOrnamental traslada
 * (translateY, ligado al scroll) una tira position:absolute inset-y-0 a
 * esta misma caja. Aunque esa tira recorta su propio contenido con
 * overflow-hidden, el navegador de todos modos suma la posición ya
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
      <BordeOrnamental />
      <OlaPapel />
      <div
        className="relative bg-papel"
        style={{
          backgroundImage: 'url(/imagenes/textura-papel.webp)',
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
