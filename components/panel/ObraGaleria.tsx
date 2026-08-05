'use client';

import { createClient } from '@/lib/supabase/client';
import type { ObraImagen } from '@/lib/tipos';
import SubidaImagen from './SubidaImagen';
import ListaOrdenable from './ListaOrdenable';

interface ObraGaleriaProps {
  obraId: string;
  imagenesIniciales: ObraImagen[];
  onCambiar: (imagenes: ObraImagen[]) => void;
}

/**
 * Sub-galería de obra_imagenes: a diferencia del resto del form (que se
 * guarda con el botón "Guardar"), cada acción acá se persiste al toque —
 * necesita la obra ya creada (obra_id), así que sólo existe en modo editar.
 */
export default function ObraGaleria({ obraId, imagenesIniciales, onCambiar }: ObraGaleriaProps) {
  async function agregar(url: string) {
    const supabase = createClient();
    const nuevoOrden = imagenesIniciales.length + 1;
    const { data, error } = await supabase
      .from('obra_imagenes')
      .insert({ obra_id: obraId, imagen_url: url, orden: nuevoOrden })
      .select('id, imagen_url, orden')
      .single();

    if (!error && data) {
      onCambiar([
        ...imagenesIniciales,
        { id: data.id, imagenUrl: data.imagen_url, orden: data.orden },
      ]);
    }
  }

  async function eliminar(imagen: ObraImagen) {
    const supabase = createClient();
    const { error } = await supabase.from('obra_imagenes').delete().eq('id', imagen.id);
    if (!error) {
      onCambiar(imagenesIniciales.filter((img) => img.id !== imagen.id));
    }
  }

  function onReordenar(nuevoOrden: ObraImagen[]) {
    onCambiar(nuevoOrden);
    const supabase = createClient();
    Promise.all(
      nuevoOrden.map((img, index) =>
        supabase.from('obra_imagenes').update({ orden: index + 1 }).eq('id', img.id),
      ),
    );
  }

  return (
    <div className="space-y-3">
      {imagenesIniciales.length > 0 && (
        <ListaOrdenable
          items={imagenesIniciales}
          onReordenar={onReordenar}
          className="space-y-2"
          renderItem={(imagen, { attributes, listeners }) => (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded p-2">
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Arrastrar para reordenar"
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 shrink-0"
              >
                ⠿
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagen.imagenUrl}
                alt=""
                className="w-16 h-16 object-cover rounded bg-slate-100 shrink-0"
              />
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => eliminar(imagen)}
                className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 shrink-0"
              >
                Eliminar
              </button>
            </div>
          )}
        />
      )}

      <SubidaImagen valor={null} onCambiar={agregar} carpeta="obras" etiqueta="Agregar imagen" />
    </div>
  );
}
