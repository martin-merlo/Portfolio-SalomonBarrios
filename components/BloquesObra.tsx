import Image from 'next/image';
import type { Bloque, TamanoBloque } from '@/lib/tipos';

// Ancho por tamaño de bloque, coherente con lo que significan en la grilla:
// chica = angosta, mediana = intermedia, banner = ancho completo de la columna.
// Siempre centrado (mx-auto en el contenedor).
const ANCHO_BLOQUE: Record<TamanoBloque, string> = {
  chica: 'max-w-sm',
  mediana: 'max-w-2xl',
  banner: 'max-w-full',
};

const SIZES_BLOQUE: Record<TamanoBloque, string> = {
  chica: '(max-width: 640px) 100vw, 384px',
  mediana: '(max-width: 640px) 100vw, 672px',
  banner: '(max-width: 640px) 100vw, (max-width: 1560px) 92vw, 1400px',
};

/**
 * Parsea un link de YouTube o Vimeo a su URL de embed + orientación.
 * Orientación: los Shorts de YouTube (/shorts/<id>) van en 9:16; el resto se
 * asume 16:9 (Vimeo no expone la orientación en la URL, así que va 16:9, el
 * caso más común). Devuelve null si el link no es parseable.
 */
function parseEmbed(url: string): { src: string; vertical: boolean } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  const partes = u.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    return partes[0] ? { src: `https://www.youtube.com/embed/${partes[0]}`, vertical: false } : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (partes[0] === 'shorts' && partes[1]) {
      return { src: `https://www.youtube.com/embed/${partes[1]}`, vertical: true };
    }
    if (partes[0] === 'embed' && partes[1]) {
      return { src: `https://www.youtube.com/embed/${partes[1]}`, vertical: false };
    }
    const v = u.searchParams.get('v');
    return v ? { src: `https://www.youtube.com/embed/${v}`, vertical: false } : null;
  }
  if (host === 'vimeo.com') {
    const id = partes[0];
    return id && /^\d+$/.test(id)
      ? { src: `https://player.vimeo.com/video/${id}`, vertical: false }
      : null;
  }
  if (host === 'player.vimeo.com') {
    const id = partes[0] === 'video' ? partes[1] : partes[0];
    return id && /^\d+$/.test(id)
      ? { src: `https://player.vimeo.com/video/${id}`, vertical: false }
      : null;
  }
  return null;
}

function BloqueTexto({ contenido }: { contenido: string }) {
  // Mismo estilo tipográfico que tenía el texto extendido (font mono de cuerpo).
  return (
    <div className="font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4">
      {contenido.split('\n\n').map((parrafo, i) => (
        <p key={i}>{parrafo}</p>
      ))}
    </div>
  );
}

function BloqueImagen({ url, tamano }: { url: string; tamano: TamanoBloque }) {
  return (
    <div className={`mx-auto ${ANCHO_BLOQUE[tamano]}`}>
      {/* width/height son sólo la relación por defecto para reservar espacio;
          w-full h-auto la muestra responsive respetando el alto real. next/image
          la optimiza (resize + formato) igual. */}
      <Image
        src={url}
        alt=""
        width={1600}
        height={1067}
        sizes={SIZES_BLOQUE[tamano]}
        className="w-full h-auto rounded-sm"
      />
    </div>
  );
}

function BloqueVideo({ url, tamano }: { url: string; tamano: TamanoBloque }) {
  const embed = parseEmbed(url);
  if (!embed) return null;
  return (
    <div className={`mx-auto ${ANCHO_BLOQUE[tamano]}`}>
      <div
        className="relative w-full overflow-hidden rounded-sm bg-tinta"
        style={{ aspectRatio: embed.vertical ? '9 / 16' : '16 / 9' }}
      >
        <iframe
          src={embed.src}
          title="Video de la obra"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}

/**
 * Renderiza los bloques de contenido de una obra (obra_bloques) en orden. Es un
 * server component: los iframes de video salen como HTML estático, sin JS de
 * cliente, así que no hay riesgo de errores de hidratación.
 */
export default function BloquesObra({ bloques }: { bloques: Bloque[] }) {
  if (bloques.length === 0) return null;

  return (
    <div className="space-y-10 sm:space-y-14">
      {bloques.map((b) => {
        const tamano: TamanoBloque = b.tamano ?? 'mediana';

        if (b.tipo === 'texto') {
          return b.contenido?.trim() ? <BloqueTexto key={b.id} contenido={b.contenido} /> : null;
        }
        if (b.tipo === 'imagen') {
          return b.imagenUrl ? <BloqueImagen key={b.id} url={b.imagenUrl} tamano={tamano} /> : null;
        }
        if (b.tipo === 'video') {
          return b.videoUrl ? <BloqueVideo key={b.id} url={b.videoUrl} tamano={tamano} /> : null;
        }
        return null;
      })}
    </div>
  );
}
