import Image from 'next/image';
import type { Bloque, TamanoBloque } from '@/lib/tipos';

// Ancho por tamaño de imagen, con la misma proporción relativa que la grilla del
// home: chica = angosta, normal = intermedia, banner = ancho completo de la
// columna. Los px no son los mismos que en el home (la columna de la página de
// obra es más angosta), pero la lógica de proporción entre los tres es la misma.
// Siempre centrado (mx-auto).
const ANCHO_BLOQUE: Record<TamanoBloque, string> = {
  chica: 'max-w-sm',
  normal: 'max-w-2xl',
  banner: 'max-w-full',
};

const SIZES_BLOQUE: Record<TamanoBloque, string> = {
  chica: '(max-width: 640px) 100vw, 384px',
  normal: '(max-width: 640px) 100vw, 672px',
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

function BloqueTexto({ titulo, contenido }: { titulo: string | null; contenido: string }) {
  const parrafos = contenido.trim() ? contenido.split('\n\n') : [];
  return (
    <div className="space-y-4">
      {titulo?.trim() && (
        // Encabezado del bloque: misma tipografía de subtítulo que el resto del
        // sitio, un escalón por debajo del subtítulo de la sección.
        <h3 className="font-subtitulo text-tinta text-base sm:text-lg">{titulo}</h3>
      )}
      {parrafos.length > 0 && (
        // Mismo estilo tipográfico que tenía el texto extendido (font mono de cuerpo).
        <div className="font-cuerpo text-tinta text-sm sm:text-base leading-relaxed space-y-4">
          {parrafos.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function BloqueImagen({ url, tamano }: { url: string; tamano: TamanoBloque }) {
  return (
    <div className={`mx-auto ${ANCHO_BLOQUE[tamano]}`}>
      {/* width/height son sólo la relación por defecto para reservar espacio;
          w-full h-auto la muestra responsive respetando el alto real. next/image
          la optimiza (resize + formato) igual. Sombra con drop-shadow (no
          box-shadow): si el artista sube un PNG recortado, sigue su forma. */}
      <Image
        src={url}
        alt=""
        width={1600}
        height={1067}
        sizes={SIZES_BLOQUE[tamano]}
        className="w-full h-auto rounded-sm drop-shadow-sutil"
      />
    </div>
  );
}

function BloqueVideo({ url, ancho }: { url: string; ancho: number }) {
  const embed = parseEmbed(url);
  if (!embed) return null;
  return (
    // Ancho = % de la columna de contenido (control fino sólo para video), y
    // centrado. Al ser relativo, en mobile sigue siendo proporcional. La
    // proporción (16:9 normal, 9:16 short) la define parseEmbed.
    <div className="mx-auto" style={{ width: `${ancho}%` }}>
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
        if (b.tipo === 'texto') {
          return b.titulo?.trim() || b.contenido?.trim() ? (
            <BloqueTexto key={b.id} titulo={b.titulo} contenido={b.contenido ?? ''} />
          ) : null;
        }
        if (b.tipo === 'imagen') {
          return b.imagenUrl ? (
            <BloqueImagen key={b.id} url={b.imagenUrl} tamano={b.tamano ?? 'normal'} />
          ) : null;
        }
        if (b.tipo === 'video') {
          return b.videoUrl ? (
            <BloqueVideo key={b.id} url={b.videoUrl} ancho={b.videoAncho ?? 100} />
          ) : null;
        }
        return null;
      })}
    </div>
  );
}
