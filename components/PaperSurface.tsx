import type { ReactNode } from 'react';
import OlaPapel from './OlaPapel';
import BordeOrnamental from './BordeOrnamental';

/**
 * El papel que tapa la obra del hero al scrollear. Sin JavaScript: el hero
 * (sticky, z-0) queda fijo detrás mientras este bloque (z-10, en flujo
 * normal) sube por encima con su borde ondulado. Una sola textura, sin
 * repetición, cubriendo todo el resto de la página de un tirón.
 *
 * BordeOrnamental vive acá adentro (no global en page.tsx) para quedar
 * acotado exactamente a esta sección de fondo claro — nunca sobre el
 * hero — y va ANTES que {children} sin z-index propio para que cualquier
 * contenido opaco de las secciones (las cards del work, por ejemplo) lo
 * tape de verdad en vez de quedar por encima.
 */
export default function PaperSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative z-10 bg-papel"
      style={{
        backgroundImage: 'url(/imagenes/textura-papel.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <BordeOrnamental />
      <OlaPapel />
      {children}
    </div>
  );
}
