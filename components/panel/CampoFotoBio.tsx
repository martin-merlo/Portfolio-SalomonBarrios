'use client';

import { useRef, useState } from 'react';
import SubidaImagen, { type MedidasImagen } from './SubidaImagen';

const CLASE_BOTON =
  'rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50';

/**
 * Foto de la bio: vista previa + Reemplazar / Quitar, sobre SubidaImagen (misma
 * compresión y subida que el resto del panel). Sólo cambia el valor del
 * formulario: el archivo viejo lo borra ContenidoForm después de guardar bien.
 * Va en un <div>, no en un <label>: el label reenviaría los clicks a los botones.
 */
export default function CampoFotoBio({
  url,
  onSubir,
  onQuitar,
}: {
  url: string;
  onSubir: (url: string, medidas?: MedidasImagen) => void;
  onQuitar: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  // Al quitar se vuelve a montar SubidaImagen: su preview local seguiría
  // mostrando la foto que se acaba de quitar.
  const [version, setVersion] = useState(0);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-slate-700">Foto de la bio</span>

      {url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="block max-h-56 max-w-full rounded border border-slate-200 bg-slate-100" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={subiendo}
              onClick={() => inputRef.current?.click()}
              className={CLASE_BOTON}
            >
              Reemplazar
            </button>
            <button
              type="button"
              disabled={subiendo}
              onClick={() => {
                onQuitar();
                setVersion((v) => v + 1);
              }}
              className={CLASE_BOTON}
            >
              Quitar foto
            </button>
          </div>
        </>
      )}

      <SubidaImagen
        key={version}
        valor={url || null}
        onCambiar={onSubir}
        carpeta="general"
        inputRef={inputRef}
        ocultarZona={Boolean(url)}
        onSubiendo={setSubiendo}
      />

      <span className="block text-xs text-slate-500">
        Se muestra debajo del texto, sin recortar. Los cambios se aplican al tocar Guardar.
      </span>
    </div>
  );
}
