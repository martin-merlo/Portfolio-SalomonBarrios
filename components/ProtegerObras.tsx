'use client';

import { useEffect } from 'react';

/**
 * Frena la descarga CASUAL de las obras: sobre cualquier elemento marcado con
 * `data-protegida` (o dentro de él) se anulan el menú contextual (clic
 * derecho → "Guardar imagen", y el menú de mantener presionado en Android) y
 * el arrastre al escritorio. El CSS de globals.css completa: sin selección y
 * sin el "Guardar en Fotos" de iOS (-webkit-touch-callout).
 *
 * Límite honesto: una imagen que se ve en el navegador ya se descargó, así que
 * esto no detiene a alguien decidido (herramientas de desarrollo, captura de
 * pantalla). La protección de fondo es servir las obras a resolución limitada
 * (máx. 1600px, ver SubidaImagen y next.config.ts): aunque se la lleven, no
 * sirve para imprimir ni vender.
 *
 * Delegación en el document (un listener por evento) para que alcance a las
 * obras que se montan después (Supabase, navegación entre páginas). Sólo actúa
 * sobre lo marcado: el resto del sitio (links, texto) conserva su menú.
 */
export default function ProtegerObras() {
  useEffect(() => {
    function bloquear(e: Event) {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('[data-protegida]')) e.preventDefault();
    }
    document.addEventListener('contextmenu', bloquear);
    document.addEventListener('dragstart', bloquear);
    return () => {
      document.removeEventListener('contextmenu', bloquear);
      document.removeEventListener('dragstart', bloquear);
    };
  }, []);
  return null;
}
