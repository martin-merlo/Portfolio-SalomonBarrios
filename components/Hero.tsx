import type { ContenidoSitio } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';
import { sanitizarHtmlRico } from '@/lib/sanitizarHtml';
import DeclaracionPaginada from './DeclaracionPaginada';

export default function Hero({ contenido }: { contenido: ContenidoSitio }) {
  return (
    <>
      <section
        id="hero"
        className="sticky top-0 z-0 w-full overflow-hidden bg-tinta"
        style={{
          height: 'calc(100vh - 100px)',
          backgroundImage: fondoImagen(contenido.heroImagenUrl),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Velo oscuro azulado. El fondo del hero (imagen + velo) queda en z-0
            para que el papel lo tape al scrollear, como siempre. El CONTENIDO
            (título/subtítulo/declaración) NO vive acá: está en la capa de abajo,
            elevada por encima del papel (ver nota). */}
        <div className="absolute inset-0 bg-tinta/45" aria-hidden="true" />
      </section>

      {/*
        Capa de contenido del hero, elevada por ENCIMA del papel (z-20 > z-10 de
        PaperSurface). Por qué existe esta capa aparte en vez de tener el contenido
        dentro del hero: al subir el papel para que su ola asome en reposo, la ola
        OPACA del papel sube tapando la zona del título mientras éste todavía vuela
        y se funde; como la copia voladora (#hero-title) vivía dentro del hero (z-0,
        debajo del papel) el papel la mordía durante el cruce (probado: aun con
        z-index alto, el stacking context del hero sticky la deja debajo del papel).
        Sacándola a esta capa hermana con z mayor, el papel nunca la tapa.

        El timing de la animación NO cambia: mismas clases y misma posición exacta
        que antes (el delta que Navbar mide en vivo es idéntico, el aterrizaje sigue
        dando 0px), sólo cambia en qué capa se dibuja.
          - sticky top-0 + margin-top negativo (= -altura del hero): se ancla igual
            que el hero y queda exactamente superpuesta a él; su aporte neto al flujo
            es 0 (alto − margen), así que no corre la posición del papel.
          - pointer-events-none: la capa queda pinneada cubriendo ~100vh durante todo
            el scroll; sin esto interceptaría los clicks de las secciones que pasan
            por debajo (Bio/Work/…). El navbar (z-50) está por encima de esta capa,
            así que sus links siguen clicables.
          - Sólo el home la necesita: en /obra el título no vuela (no hay cruce), el
            papel lo tapa como a cualquier contenido del hero, así que ObraHero no
            cambia.
          - motion-reduce:z-0 — CRÍTICO para reduced-motion: ahí NO hay animación,
            el título grande queda estático a opacity 1. Si la capa siguiera en z-20
            (encima del papel) el título quedaría pinneado tapando el contenido al
            scrollear para siempre. Con z-0 en reduced-motion vuelve a quedar debajo
            del papel, que lo tapa al scrollear igual que antes de este cambio.
      */}
      <div
        className="sticky top-0 z-20 motion-reduce:z-0 w-full overflow-hidden pointer-events-none"
        style={{ height: 'calc(100vh - 100px)', marginTop: 'calc(-1 * (100vh - 100px))' }}
      >
        <div className="h-full px-5 sm:px-10 lg:px-14 pt-16 md:pt-0 flex flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between md:gap-12">
          {/*
            Posición del título: prioriza la COMPOSICIÓN en reposo (como en
            referencia/diseño.pdf, donde el título arranca a ~12% del ancho) por
            sobre lo marcada que quede la diagonal del vuelo al navbar.
            - lg:pl-[7.5vw] (+ el lg:px-14 del contenedor): 1024 → ~133px,
              1280 → 152px, 1440 → 164px. En vw a propósito: el título mismo se
              mide en vw, así que el bloque mantiene la proporción en cualquier
              ancho de escritorio. Por lo mismo esta capa NO lleva el tope
              max-w-[1500px] que usan las demás secciones: con el tope, a 1920px
              el título quedaba centrado (~22% del ancho) en vez de a la izquierda.
            - Costo aceptado: el Navbar mide en vivo el delta entre este título y
              su slot en el navbar (px-3/8/12). Con el título más a la izquierda
              el desplazamiento horizontal se achica y la trayectoria queda menos
              diagonal (|deltaX|/|deltaY| ≈ 0.36 a 1280x800, antes 0.63). El
              ATERRIZAJE no cambia: el destino se mide en vivo, sigue llegando
              exacto (0px) al left del slot sin importar este valor.
            - Solo desktop (lg:+). En md el título ya va pegado al padding del
              contenedor, y mobile usa crossfade en vez de vuelo.
          */}
          <div className="lg:pl-[7.5vw]">
            {/*
              text-[12vw] en vez de 15vw: medido en vivo, "SALOMÓN BARRIOS" con
              15vw se salía del viewport por ~45px en 360/390px (overflow-hidden
              de la capa recorta, así que no se veía un scrollbar horizontal,
              se veía directamente la palabra cortada). La medición se hizo con
              el fallback real que Next genera para Sekuya ("sekuya Fallback",
              aproximado a Arial Black) porque el archivo de la fuente todavía
              no está — ver public/fonts/README.md — que es justo el escenario
              más ancho que hay que cubrir. 12vw entra con margen en 320–639px;
              sm/md/lg quedan iguales (no hacía falta tocarlos, no se cortaban).
              break-words como red de seguridad si algún título más largo
              entrara por el panel.
            */}
            <h1
              id="hero-title"
              data-aberracion="texto"
              className="font-display uppercase text-claro leading-[0.92] break-words text-[12vw] sm:text-[10vw] md:text-[6.2vw] lg:text-[5.4vw]"
              style={{ transformOrigin: 'left center', position: 'relative' }}
            >
              {contenido.heroTitulo}
            </h1>
            <p id="hero-sub" className="font-mono text-claro/90 mt-4 sm:mt-6 text-sm sm:text-base">
              {contenido.heroSubtitulo}
            </p>
          </div>

          {/* Alineado a la izquierda (pedido del artista, diseño original).
              Cuadro grande (ancho/alto en DeclaracionPaginada), apenas corrido
              del borde derecho con lg:mr-*. Paginada
              porque el texto es largo; lleva id="hero-declaracion", que el
              Navbar desvanece con el scroll con el MISMO tween que al subtítulo
              del nombre (#hero-sub). Ver DeclaracionPaginada. */}
          <DeclaracionPaginada
            titulo={contenido.declaracionTitulo}
            html={sanitizarHtmlRico(contenido.declaracionTexto)}
          />
        </div>
      </div>
    </>
  );
}
