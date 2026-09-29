'use client';

import { usePaginacion } from '@/lib/usePaginacion';
import { ControlesPaginas, PistaPaginas } from './Paginacion';

// Caja de cada página. Desktop/tablet: 55vh, pero nunca más que 100vh − 340px
// — el hero mide 100vh − 100px y el bloque suma ~90px de título + controles;
// ese tope deja el bloque centrado sin meterse bajo el navbar (72px) en
// pantallas bajas (p. ej. 1280x650).
// Mobile: hasta 30vh (antes 24vh fijo) — el bloque va apilado debajo del título
// y la ola del papel asoma por abajo. En teléfonos bajos se recorta con
// 100vh − 474px para que los controles no queden pegados a la ola (medido: a
// 360x640 quedaban a 7px con 30vh), sin bajar nunca de los 24vh de antes.
const ALTO_CAJA =
  'h-[max(24vh,min(30vh,calc(100vh_-_474px)))] md:h-[min(55vh,calc(100vh_-_340px))]';

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
 *
 * Ancho: hasta 40vw (tope 640px) en desktop para que entre bastante texto
 * por página. Si no hay lugar, el flex del hero lo angosta antes que pisar al
 * título (gap-12 entre ambos), y la paginación se recalcula con lo que quede.
 * min-w-0 es lo que habilita ese angostamiento: sin él, el min-width:auto del
 * flex toma el mínimo de la pista de páginas (todas en fila) y el bloque se
 * salía del hero por la derecha en tablet (768–1023px), recortado.
 */
export default function DeclaracionPaginada({ titulo, texto }: { titulo: string; texto: string }) {
  const { contenedorRef, paginas, pagina, setPagina, ir, total } = usePaginacion(texto, CLASE_TEXTO);

  return (
    <div id="hero-declaracion" className="w-full min-w-0 max-w-sm md:max-w-md lg:max-w-[min(40vw,640px)] md:mt-2 lg:mr-6 xl:mr-10">
      <h2 className="font-mono uppercase tracking-wide text-claro text-base sm:text-lg lg:text-xl mb-3">
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
          etiqueta="Páginas de la declaración del artista"
          className="mt-4 pointer-events-auto"
        />
      )}
    </div>
  );
}
