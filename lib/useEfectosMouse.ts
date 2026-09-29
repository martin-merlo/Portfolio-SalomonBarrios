import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const MOUSE_REAL = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Condiciones compartidas por los efectos que siguen al mouse (cursor custom,
 * aberración cromática):
 *  - `disponible`: sitio público (no /panel) y un mouse real (hover + puntero
 *    fino). En touch o sin hover es false: no hay mouse que seguir.
 *  - `reducido`: el usuario pidió prefers-reduced-motion.
 * Se reevalúan si cambian (tablet a la que se le conecta un mouse, etc.).
 */
export function useEfectosMouse() {
  const pathname = usePathname();
  const enPanel = pathname?.startsWith('/panel') ?? false;
  const [mouseReal, setMouseReal] = useState(false);
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    const mmMouse = window.matchMedia(MOUSE_REAL);
    const mmReducido = window.matchMedia(REDUCED_MOTION);
    const sync = () => {
      setMouseReal(mmMouse.matches);
      setReducido(mmReducido.matches);
    };
    sync();
    mmMouse.addEventListener('change', sync);
    mmReducido.addEventListener('change', sync);
    return () => {
      mmMouse.removeEventListener('change', sync);
      mmReducido.removeEventListener('change', sync);
    };
  }, []);

  return { disponible: !enPanel && mouseReal, reducido };
}
