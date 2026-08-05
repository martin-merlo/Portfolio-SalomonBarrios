'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Obra } from '@/lib/tipos';
import ListaOrdenable from './ListaOrdenable';

const ETIQUETA_TAMANO: Record<Obra['tamanoGrilla'], string> = {
  normal: 'Normal',
  banner: 'Banner',
  chica: 'Chica',
};

export default function ObrasLista({ obrasIniciales }: { obrasIniciales: Obra[] }) {
  const router = useRouter();
  const [obras, setObras] = useState(obrasIniciales);
  const [error, setError] = useState<string | null>(null);

  function onReordenar(nuevoOrden: Obra[]) {
    setObras(nuevoOrden);
    setError(null);

    const supabase = createClient();
    Promise.all(
      nuevoOrden.map((obra, index) =>
        supabase.from('obras').update({ orden: index + 1 }).eq('id', obra.id),
      ),
    )
      .then(() => router.refresh())
      .catch(() => setError('No se pudo guardar el nuevo orden.'));
  }

  async function togglePublicada(obra: Obra) {
    const nuevoValor = !obra.publicada;
    setObras((prev) => prev.map((o) => (o.id === obra.id ? { ...o, publicada: nuevoValor } : o)));

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('obras')
      .update({ publicada: nuevoValor })
      .eq('id', obra.id);

    if (updateError) {
      setObras((prev) => prev.map((o) => (o.id === obra.id ? { ...o, publicada: obra.publicada } : o)));
      setError('No se pudo cambiar el estado de publicación.');
    }
    router.refresh();
  }

  async function eliminar(obra: Obra) {
    if (!window.confirm(`¿Eliminar "${obra.titulo}"? Esta acción no se puede deshacer.`)) return;

    const supabase = createClient();
    await supabase.from('obra_imagenes').delete().eq('obra_id', obra.id);
    const { error: deleteError } = await supabase.from('obras').delete().eq('id', obra.id);

    if (deleteError) {
      setError('No se pudo eliminar la obra.');
      return;
    }

    setObras((prev) => prev.filter((o) => o.id !== obra.id));
    router.refresh();
  }

  if (obras.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no hay obras cargadas.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ListaOrdenable
        items={obras}
        onReordenar={onReordenar}
        className="space-y-2"
        renderItem={(obra, { attributes, listeners }) => (
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
              src={obra.imagenUrl}
              alt=""
              className="w-14 h-14 object-cover rounded bg-slate-100 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{obra.titulo}</p>
              <p className="text-xs text-slate-500">
                {ETIQUETA_TAMANO[obra.tamanoGrilla]}
                {!obra.publicada && ' · Borrador'}
                {!obra.tienePaginaPropia && ' · Sin página propia'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
              <input
                type="checkbox"
                checked={obra.publicada}
                onChange={() => togglePublicada(obra)}
                className="h-4 w-4"
              />
              Publicada
            </label>

            <Link
              href={`/panel/obras/${obra.id}`}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 shrink-0 px-2 py-1"
            >
              Editar
            </Link>

            <button
              type="button"
              onClick={() => eliminar(obra)}
              className="text-xs font-medium text-red-600 hover:text-red-800 shrink-0 px-2 py-1"
            >
              Eliminar
            </button>
          </div>
        )}
      />
    </div>
  );
}
