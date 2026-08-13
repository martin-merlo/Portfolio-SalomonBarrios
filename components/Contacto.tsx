import type { ContenidoSitio } from '@/lib/tipos';
import SectionLabel from './SectionLabel';

function IconoInstagram() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconoTikTok() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function Contacto({ contenido }: { contenido: ContenidoSitio }) {
  return (
    <section id="contacto" className="px-5 sm:px-10 lg:px-14 pb-24 sm:pb-32">
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="Contactame.4" entradaPanel />

        <div className="flex flex-col items-center text-center gap-5 sm:gap-6 py-6 sm:py-10">
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

          <div className="flex gap-6 mt-2 text-tinta">
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

          <div className="mt-10 sm:mt-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/imagenes/firma.png"
              alt="Firma de Salomón Barrios"
              width={180}
              height={180}
              className="w-[140px] sm:w-[180px] h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
