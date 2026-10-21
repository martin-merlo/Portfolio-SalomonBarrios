'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ImagenProceso } from '@/lib/tipos';
import SubidaImagen from './SubidaImagen';
import ListaOrdenable from './ListaOrdenable';
import CampoBilingue from './CampoBilingue';

export default function ProcesoLista({ itemsIniciales }: { itemsIniciales: ImagenProceso[] }) {
  const router = useRouter();
  const [items, setItems] = useState(itemsIniciales);
  const [error, setError] = useState<string | null>(null);

  async function agregar(url: string) {
    const supabase = createClient();
    const nuevoOrden = items.length + 1;
    const { data, error: insertError } = await supabase
      .from('proceso')
      .insert({ imagen_url: url, texto_corto: '', orden: nuevoOrden })
      .select('*')
      .single();

    if (insertError || !data) {
      setError('No se pudo agregar la imagen.');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: data.id,
        imagenUrl: data.imagen_url,
        textoCorto: data.texto_corto,
        orden: data.orden,
        textoCortoEn: data.texto_corto_en ?? null,
      },
    ]);
    router.refresh();
  }

  async function eliminar(item: ImagenProceso) {
    if (!window.confirm('¿Eliminar esta imagen de proceso?')) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('proceso').delete().eq('id', item.id);
    if (deleteError) {
      setError('No se pudo eliminar.');
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.refresh();
  }

  function onCambiarTexto(id: string, idioma: 'es' | 'en', texto: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? (idioma === 'es' ? { ...i, textoCorto: texto } : { ...i, textoCortoEn: texto }) : i)),
    );
  }

  async function guardarTexto(id: string, idioma: 'es' | 'en', texto: string) {
    const supabase = createClient();
    await supabase
      .from('proceso')
      .update(idioma === 'es' ? { texto_corto: texto } : { texto_corto_en: texto.trim() || null })
      .eq('id', id);
    router.refresh();
  }

  function onReordenar(nuevoOrden: ImagenProceso[]) {
    setItems(nuevoOrden);
    const supabase = createClient();
    Promise.all(
      nuevoOrden.map((item, index) =>
        supabase.from('proceso').update({ orden: index + 1 }).eq('id', item.id),
      ),
    )
      .then(() => router.refresh())
      .catch(() => setError('No se pudo guardar el nuevo orden.'));
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length > 0 && (
        <ListaOrdenable
          items={items}
          onReordenar={onReordenar}
          className="space-y-2"
          renderItem={(item, { attributes, listeners }) => (
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
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
                src={item.imagenUrl}
                alt=""
                className="w-16 h-16 object-cover rounded bg-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <CampoBilingue
                  etiqueta="Texto corto"
                  tipo="linea"
                  placeholder="Texto corto (opcional)"
                  es={item.textoCorto}
                  en={item.textoCortoEn ?? ''}
                  onCambio={(idioma, v) => onCambiarTexto(item.id, idioma, v)}
                  onGuardar={(idioma, v) => guardarTexto(item.id, idioma, v)}
                />
              </div>
              <button
                type="button"
                onClick={() => eliminar(item)}
                className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 shrink-0"
              >
                Eliminar
              </button>
            </div>
          )}
        />
      )}

      <SubidaImagen valor={null} onCambiar={agregar} carpeta="proceso" etiqueta="Agregar imagen de proceso" />
    </div>
  );
}
