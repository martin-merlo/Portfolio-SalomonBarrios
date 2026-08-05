'use client';

import { useRef, useState, type DragEvent } from 'react';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = 'media';

export type CarpetaSubida = 'obras' | 'proceso' | 'general';

/** Sube un blob al bucket "media" con XHR (no fetch) para poder reportar
 * progreso real de subida — la lib de Supabase no expone eso. */
function subirConProgreso(
  ruta: string,
  blob: Blob,
  accessToken: string,
  onProgreso: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgreso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`No se pudo subir la imagen (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('Error de red subiendo la imagen.'));
    xhr.send(blob);
  });
}

function urlPublica(ruta: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;
}

interface SubidaImagenProps {
  valor: string | null;
  onCambiar: (url: string) => void;
  carpeta: CarpetaSubida;
  etiqueta?: string;
}

/**
 * Drag & drop o click para elegir archivo → preview inmediata en el
 * navegador → compresión client-side (máx. 2500px, calidad 0.85) → subida
 * directa al bucket "media" con barra de progreso → devuelve la URL pública
 * final vía onCambiar. Reutilizado en obra principal, hover, galería de
 * obra, proceso e imagen del hero.
 */
export default function SubidaImagen({ valor, onCambiar, carpeta, etiqueta }: SubidaImagenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imagenMostrada = preview ?? valor;

  async function procesarArchivo(archivo: File) {
    setError(null);

    if (!archivo.type.startsWith('image/')) {
      setError('El archivo tiene que ser una imagen.');
      return;
    }

    const previewLocal = URL.createObjectURL(archivo);
    setPreview(previewLocal);
    setProgreso(0);

    try {
      const comprimido = await imageCompression(archivo, {
        maxWidthOrHeight: 2500,
        initialQuality: 0.85,
        fileType: 'image/jpeg',
        useWebWorker: true,
      });

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('Se venció la sesión. Volvé a loguearte.');
        setProgreso(null);
        return;
      }

      const ruta = `${carpeta}/${crypto.randomUUID()}.jpg`;
      await subirConProgreso(ruta, comprimido, session.access_token, setProgreso);

      onCambiar(urlPublica(ruta));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado subiendo la imagen.');
    } finally {
      setProgreso(null);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files?.[0];
    if (archivo) procesarArchivo(archivo);
  }

  return (
    <div className="space-y-2">
      {etiqueta && <p className="text-sm font-medium text-slate-700">{etiqueta}</p>}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}
        className={`relative flex items-center gap-4 rounded border-2 border-dashed p-3 cursor-pointer transition-colors ${
          arrastrando ? 'border-slate-500 bg-slate-100' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {imagenMostrada ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagenMostrada}
            alt=""
            className="w-20 h-20 object-cover rounded shrink-0 bg-slate-200"
          />
        ) : (
          <div className="w-20 h-20 rounded shrink-0 bg-slate-200 flex items-center justify-center text-slate-400 text-xs text-center">
            Sin imagen
          </div>
        )}

        <div className="text-sm text-slate-600">
          <p className="font-medium">Arrastrá una imagen acá o hacé click para elegirla</p>
          <p className="text-xs text-slate-400 mt-0.5">Se comprime automáticamente antes de subir.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) procesarArchivo(archivo);
            e.target.value = '';
          }}
        />
      </div>

      {progreso !== null && (
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-slate-700 transition-all"
            style={{ width: `${progreso}%` }}
            role="progressbar"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
