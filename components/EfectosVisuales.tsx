'use client';

import { EFECTOS } from '@/lib/efectos';
import { useEfectosMouse } from '@/lib/useEfectosMouse';
import AberracionCromatica from './AberracionCromatica';

/**
 * Monta la capa de efectos visuales del sitio público, cada uno según su
 * interruptor en lib/efectos.ts (independientes entre sí):
 *  - aberración cromática difuminada, reactiva al cursor (AberracionCromatica);
 *  - grano de película animado (.efecto-grano en globals.css);
 *  - scanlines CRT estáticas (.efecto-scanlines en globals.css).
 *
 * Condiciones: nada en /panel ni en touch (sin mouse real: la aberración no
 * tiene a quién seguir y grano/scanlines sólo gastarían batería). Con
 * prefers-reduced-motion se apagan la aberración y el grano (movimiento); las
 * scanlines, estáticas, quedan.
 */
export default function EfectosVisuales() {
  const { disponible, reducido } = useEfectosMouse();
  if (!disponible) return null;
  return (
    <>
      {EFECTOS.aberracionActiva && !reducido && <AberracionCromatica />}
      {EFECTOS.noiseActivo && !reducido && <div aria-hidden="true" className="efecto-grano" />}
      {EFECTOS.scanlinesActivo && <div aria-hidden="true" className="efecto-scanlines" />}
    </>
  );
}
