import { useEffect, useRef, type RefObject } from 'react';

// Delta acumulado (px) que tiene que sumar un gesto antes de pasar de página:
// filtra los micro-deltas de un trackpad apenas rozado. Una muesca de rueda de
// mouse ya da ~100px, así que con el mouse pasa de una.
const UMBRAL_PX = 40;
// Sin eventos wheel durante este lapso = el gesto terminó (la rueda dejó de
// girar o la inercia del trackpad se apagó).
const FIN_GESTO_MS = 200;
// Tras pasar a la última (o primera) página, la cola del MISMO gesto —sobre
// todo la inercia del trackpad— se sigue consumiendo este tiempo como máximo
// para que no "se escape" a scrollear la página a mitad de gesto. Pasado este
// tope el scroll vuelve a la página aunque el gesto siga: nunca atrapa.
const COLA_MAX_MS = 800;

/** Normaliza el delta a píxeles (Firefox puede reportar líneas o páginas). */
function aPixeles(delta: number, modo: number): number {
  if (modo === 1) return delta * 16;
  if (modo === 2) return delta * window.innerHeight;
  return delta;
}

/**
 * Rueda del mouse / trackpad sobre `cajaRef` → pasa páginas: abajo/derecha =
 * siguiente, arriba/izquierda = anterior. Un gesto = un cambio de página.
 *
 * No atrapa el scroll: sólo hace preventDefault si HAY página en esa
 * dirección. En la última página yendo hacia adelante (o en la primera yendo
 * hacia atrás) el evento pasa y la página scrollea normal. La única excepción
 * es la cola del gesto que acaba de llegar al extremo (ver COLA_MAX_MS).
 *
 * Solo desktop: se activa con puntero fino (mouse/trackpad). En touch no hay
 * eventos wheel y además no se escucha ningún evento táctil, así que el scroll
 * con el dedo sobre la caja queda intacto. El listener es { passive: false }
 * porque necesita poder cancelar el scroll (React registra onWheel como
 * pasivo, por eso va con addEventListener).
 */
export function useRuedaPaginas(
  cajaRef: RefObject<HTMLElement | null>,
  pagina: number,
  total: number,
  setPagina: (i: number) => void,
) {
  // El listener se registra una sola vez; lee el estado vivo por refs.
  const estado = useRef({ pagina, total, setPagina });
  useEffect(() => {
    estado.current = { pagina, total, setPagina };
  }, [pagina, total, setPagina]);

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    const punteroFino = window.matchMedia('(pointer: fine)');

    let gestoActivo = false;
    let yaCambio = false; // este gesto ya pasó de página
    let dirGesto = 0;
    let acumulado = 0;
    let tCambio = 0;
    let timerFin: ReturnType<typeof setTimeout> | undefined;

    function terminarGesto() {
      gestoActivo = false;
      yaCambio = false;
      dirGesto = 0;
      acumulado = 0;
    }

    function onWheel(e: WheelEvent) {
      if (!punteroFino.matches || e.ctrlKey) return; // ctrl+rueda = zoom
      // No cancelable = el navegador ya enganchó este gesto al scroll de la
      // página (Chrome lo hace cuando el gesto empezó fuera de la caja y la
      // caja pasó por debajo del cursor). No se puede frenar ese scroll, así
      // que tampoco se pasa de página: si no, pasaría de página Y scrollearía.
      if (!e.cancelable) return;
      const dx = aPixeles(e.deltaX, e.deltaMode);
      const dy = aPixeles(e.deltaY, e.deltaMode);
      const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      if (d === 0) return;
      const dir = d > 0 ? 1 : -1;

      // Cambio de sentido a mitad de gesto = intención nueva.
      if (gestoActivo && dir !== dirGesto) terminarGesto();
      clearTimeout(timerFin);
      timerFin = setTimeout(terminarGesto, FIN_GESTO_MS);
      gestoActivo = true;
      dirGesto = dir;

      const { pagina: actual, total: n, setPagina: irA } = estado.current;
      const destino = actual + dir;
      const hayPagina = destino >= 0 && destino < n;

      if (!hayPagina) {
        // Extremo: dejar scrollear, salvo la cola corta del gesto que nos
        // trajo hasta acá.
        if (yaCambio && performance.now() - tCambio < COLA_MAX_MS) e.preventDefault();
        return;
      }

      e.preventDefault();
      if (yaCambio) return;
      acumulado += Math.abs(d);
      if (acumulado < UMBRAL_PX) return;
      yaCambio = true;
      tCambio = performance.now();
      irA(destino);
    }

    caja.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      caja.removeEventListener('wheel', onWheel);
      clearTimeout(timerFin);
    };
  }, [cajaRef]);
}
