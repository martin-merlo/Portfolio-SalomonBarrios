import { textos, type Idioma } from '@/lib/i18n';
import type { ContenidoSitio } from '@/lib/tipos';
import { MARGEN_PAPEL } from '@/lib/estilos';
import SectionLabel from './SectionLabel';

function IconoInstagram() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconoTikTok() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3v10.8a3.1 3.1 0 1 1-2.2-2.97"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 3c.3 2.2 1.9 3.9 4 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Contacto({ contenido, idioma }: { contenido: ContenidoSitio; idioma: Idioma }) {
  const tx = textos(idioma);
  return (
    // Compacto a propósito (pedido del artista): al llegar desde el navbar se
    // ven el contacto y el carrusel de proceso a la vez. Sin padding inferior:
    // el aire hasta el carrusel lo pone el padding propio de Proceso.
    <section id="contacto" className={`${MARGEN_PAPEL} scroll-mt-16 sm:scroll-mt-[72px]`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto={tx.labels.contacto} entradaPanel />

        <div className="flex flex-col items-center text-center gap-5 sm:gap-6 pt-4 sm:pt-6">
          <a
            href={`tel:${contenido.contactoTelefono.replace(/\s+/g, '')}`}
            className="font-cuerpo text-tinta text-lg sm:text-xl hover:opacity-70 transition-opacity"
          >
            {contenido.contactoTelefono}
          </a>
          <a
            href={`mailto:${contenido.contactoEmail}`}
            className="font-cuerpo text-tinta text-base sm:text-lg hover:opacity-70 transition-opacity"
          >
            {contenido.contactoEmail}
          </a>

          <div className="flex items-center gap-8 sm:gap-10 mt-2 text-tinta">
            <a
              href={contenido.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-70 transition-opacity"
            >
              <IconoInstagram />
            </a>
            <a
              href={contenido.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="hover:opacity-70 transition-opacity"
            >
              <IconoTikTok />
            </a>
          </div>

          {/* firma.png está recortada al trazo (6px de margen sobre el original
              de 1080x1080, que tenía un tercio de aire transparente arriba y
              otro abajo, y lo dejaba descentrado). Así los espacios de acá son
              los reales y el trazo mide lo mismo que antes: 160px de ancho en
              mobile y 206px desde sm.
              data-protegida: sin clic derecho → "Guardar imagen" ni arrastre,
              igual que las obras (ver ProtegerObras). */}
          <div data-protegida className="mt-3 sm:mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/firma.png"
              alt={tx.firma}
              width={631}
              height={364}
              draggable={false}
              className="w-[164px] sm:w-[210px] h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
