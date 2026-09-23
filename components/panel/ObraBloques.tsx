'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { mapBloque } from '@/lib/mapeo';
import type { BloqueRow } from '@/lib/mapeo';
import type { Bloque, TamanoBloque, TipoBloque } from '@/lib/tipos';
import SubidaImagen from './SubidaImagen';
import ListaOrdenable from './ListaOrdenable';

// Mismos 3 botones visuales que el tamaño de grilla de las obras (ObraForm),
// pero con los valores de bloque de imagen (chica / mediana / banner).
const TAMANOS_BLOQUE: { valor: TamanoBloque; etiqueta: string; forma: string }[] = [
  { valor: 'chica', etiqueta: 'Chica', forma: 'aspect-[4/1] w-16' },
  { valor: 'mediana', etiqueta: 'Mediana', forma: 'aspect-square w-10' },
  { valor: 'banner', etiqueta: 'Banner', forma: 'aspect-[3/1] w-16' },
];

const TIPOS: { valor: TipoBloque; etiqueta: string }[] = [
  { valor: 'texto', etiqueta: '+ Texto' },
  { valor: 'imagen', etiqueta: '+ Imagen' },
  { valor: 'video', etiqueta: '+ Video' },
];

// Columnas explícitas para no depender del orden de select('*').
const COLS = 'id, obra_id, tipo, orden, contenido, imagen_url, tamano, video_url';

/** Acepta sólo links de YouTube o Vimeo (con o sin www, youtu.be, player.vimeo.com). */
function esUrlVideoValida(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  return (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtu.be' ||
    host === 'vimeo.com' ||
    host === 'player.vimeo.com'
  );
}

/** Thumbnail de YouTube si el link es de YouTube; null en otro caso (Vimeo, etc.). */
function thumbnailYouTube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    let id = '';
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host.endsWith('youtube.com')) id = u.searchParams.get('v') ?? '';
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

/**
 * Editor de "Contenido en bloques" (tabla obra_bloques). Sólo en modo editar
 * (necesita obra_id) y cada acción se persiste al toque, no con el botón
 * "Guardar" del form. Carga sus propios bloques al montar. Es el contenido de la
 * página individual, debajo del subtítulo.
 */
export default function ObraBloques({ obraId }: { obraId: string }) {
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Error de validación por bloque de video (id -> mensaje).
  const [erroresVideo, setErroresVideo] = useState<Record<string, string>>({});

  useEffect(() => {
    let vivo = true;
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('obra_bloques')
        .select(COLS)
        .eq('obra_id', obraId)
        .order('orden', { ascending: true });
      if (!vivo) return;
      if (err) setError('No se pudieron cargar los bloques.');
      else setBloques((data as BloqueRow[]).map(mapBloque));
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [obraId]);

  function setCampo(id: string, cambios: Partial<Bloque>) {
    setBloques((prev) => prev.map((b) => (b.id === id ? { ...b, ...cambios } : b)));
  }

  async function persistir(id: string, cols: Record<string, unknown>) {
    const supabase = createClient();
    const { error: err } = await supabase.from('obra_bloques').update(cols).eq('id', id);
    if (err) setError('No se pudo guardar el cambio. Probá de nuevo.');
  }

  async function agregar(tipo: TipoBloque) {
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('obra_bloques')
      .insert({
        obra_id: obraId,
        tipo,
        orden: bloques.length + 1,
        contenido: null,
        imagen_url: null,
        tamano: tipo === 'imagen' ? 'mediana' : null,
        video_url: null,
      })
      .select(COLS)
      .single();

    if (err || !data) {
      setError('No se pudo agregar el bloque.');
      return;
    }
    setBloques((prev) => [...prev, mapBloque(data as BloqueRow)]);
  }

  async function eliminar(bloque: Bloque) {
    if (!window.confirm('¿Eliminar este bloque? No se puede deshacer.')) return;
    const supabase = createClient();
    const { error: err } = await supabase.from('obra_bloques').delete().eq('id', bloque.id);
    if (err) {
      setError('No se pudo eliminar el bloque.');
      return;
    }
    setBloques((prev) => prev.filter((b) => b.id !== bloque.id));
    setErroresVideo((e) => {
      const n = { ...e };
      delete n[bloque.id];
      return n;
    });
  }

  function onReordenar(nuevoOrden: Bloque[]) {
    setBloques(nuevoOrden);
    const supabase = createClient();
    Promise.all(
      nuevoOrden.map((b, i) => supabase.from('obra_bloques').update({ orden: i + 1 }).eq('id', b.id)),
    ).catch(() => setError('No se pudo guardar el nuevo orden.'));
  }

  function limpiarErrorVideo(id: string) {
    setErroresVideo((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
  }

  function guardarVideo(b: Bloque) {
    const url = (b.videoUrl ?? '').trim();
    if (url === '') {
      limpiarErrorVideo(b.id);
      persistir(b.id, { video_url: null });
      return;
    }
    if (!esUrlVideoValida(url)) {
      setErroresVideo((e) => ({ ...e, [b.id]: 'Pegá un link de YouTube o Vimeo válido.' }));
      return; // no se persiste un link inválido
    }
    limpiarErrorVideo(b.id);
    persistir(b.id, { video_url: url });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando bloques…</p>
      ) : bloques.length > 0 ? (
        <ListaOrdenable
          items={bloques}
          onReordenar={onReordenar}
          className="space-y-3"
          renderItem={(b, { attributes, listeners }) => (
            <div className="flex gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Arrastrar para reordenar"
                className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 px-1 shrink-0 self-start pt-1"
              >
                ⠿
              </button>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {b.tipo}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminar(b)}
                    className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 shrink-0"
                  >
                    Eliminar
                  </button>
                </div>

                {b.tipo === 'texto' && (
                  <textarea
                    value={b.contenido ?? ''}
                    onChange={(e) => setCampo(b.id, { contenido: e.target.value })}
                    onBlur={() => persistir(b.id, { contenido: b.contenido })}
                    rows={4}
                    placeholder="Texto del bloque…"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  />
                )}

                {b.tipo === 'imagen' && (
                  <div className="space-y-3">
                    <SubidaImagen
                      valor={b.imagenUrl}
                      onCambiar={(url) => {
                        setCampo(b.id, { imagenUrl: url });
                        persistir(b.id, { imagen_url: url });
                      }}
                      carpeta="obras"
                    />
                    <div className="flex items-end gap-3">
                      {TAMANOS_BLOQUE.map((op) => (
                        <div key={op.valor} className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCampo(b.id, { tamano: op.valor });
                              persistir(b.id, { tamano: op.valor });
                            }}
                            className={`flex items-center justify-center rounded border-2 p-2 transition-colors ${
                              b.tamano === op.valor
                                ? 'border-slate-700 bg-slate-100'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <span className={`bg-slate-400 rounded-sm ${op.forma}`} />
                          </button>
                          <span className="text-xs text-slate-600">{op.etiqueta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {b.tipo === 'video' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={b.videoUrl ?? ''}
                      onChange={(e) => {
                        setCampo(b.id, { videoUrl: e.target.value });
                        if (erroresVideo[b.id]) limpiarErrorVideo(b.id);
                      }}
                      onBlur={() => guardarVideo(b)}
                      placeholder="https://www.youtube.com/watch?v=… o https://vimeo.com/…"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                    {erroresVideo[b.id] ? (
                      <p className="text-sm text-red-600">{erroresVideo[b.id]}</p>
                    ) : b.videoUrl ? (
                      <div className="flex items-center gap-3">
                        {thumbnailYouTube(b.videoUrl) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbnailYouTube(b.videoUrl)!}
                            alt=""
                            className="w-24 h-14 object-cover rounded bg-slate-100 shrink-0"
                          />
                        )}
                        <a
                          href={b.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-700 hover:underline break-all"
                        >
                          {b.videoUrl}
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <p className="text-sm text-slate-500">
          Todavía no hay bloques. Agregá el primero con los botones de abajo.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => agregar(t.valor)}
            className="rounded border border-slate-300 bg-white text-sm text-slate-700 px-3 py-1.5 hover:border-slate-500 hover:bg-slate-50 transition-colors"
          >
            {t.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
