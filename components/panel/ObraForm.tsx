'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/util/slug';
import type { ObraConDetalle, ObraImagen, TamanoGrilla } from '@/lib/tipos';
import SubidaImagen from './SubidaImagen';
import Toggle from './Toggle';
import ObraGaleria from './ObraGaleria';

const OPCIONES_TAMANO: { valor: TamanoGrilla; etiqueta: string; forma: string }[] = [
  { valor: 'normal', etiqueta: 'Normal', forma: 'aspect-square w-10' },
  { valor: 'banner', etiqueta: 'Banner', forma: 'aspect-[3/1] w-16' },
  { valor: 'chica', etiqueta: 'Chica', forma: 'aspect-[4/1] w-16' },
];

async function generarSlugUnico(
  supabase: ReturnType<typeof createClient>,
  base: string,
): Promise<string> {
  const baseSlug = base || 'obra';
  const { data } = await supabase.from('obras').select('slug').ilike('slug', `${baseSlug}%`);
  const usados = new Set((data ?? []).map((f: { slug: string }) => f.slug));
  if (!usados.has(baseSlug)) return baseSlug;
  let n = 2;
  while (usados.has(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}

interface ObraFormProps {
  modo: 'crear' | 'editar';
  obraInicial?: ObraConDetalle;
}

export default function ObraForm({ modo, obraInicial }: ObraFormProps) {
  const router = useRouter();

  const [titulo, setTitulo] = useState(obraInicial?.titulo ?? '');
  const [tecnica, setTecnica] = useState(obraInicial?.tecnica ?? '');
  const [anio, setAnio] = useState(obraInicial?.anio != null ? String(obraInicial.anio) : '');
  const [dimensiones, setDimensiones] = useState(obraInicial?.dimensiones ?? '');
  const [descripcion, setDescripcion] = useState(obraInicial?.descripcion ?? '');
  const [imagenUrl, setImagenUrl] = useState<string | null>(obraInicial?.imagenUrl ?? null);
  const [tieneHover, setTieneHover] = useState(obraInicial?.tieneHover ?? false);
  const [imagenHoverUrl, setImagenHoverUrl] = useState<string | null>(
    obraInicial?.imagenHoverUrl ?? null,
  );
  const [tamanoGrilla, setTamanoGrilla] = useState<TamanoGrilla>(obraInicial?.tamanoGrilla ?? 'normal');
  const [publicada, setPublicada] = useState(obraInicial?.publicada ?? false);
  const [tienePaginaPropia, setTienePaginaPropia] = useState(obraInicial?.tienePaginaPropia ?? true);
  const [slug, setSlug] = useState(obraInicial?.slug ?? '');
  const [slugTocado, setSlugTocado] = useState(modo === 'editar');
  const [subtituloExtendido, setSubtituloExtendido] = useState(obraInicial?.subtituloExtendido ?? '');
  const [textoExtendido, setTextoExtendido] = useState(obraInicial?.textoExtendido ?? '');
  const [imagenes, setImagenes] = useState<ObraImagen[]>(obraInicial?.imagenes ?? []);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onCambiarTitulo(v: string) {
    setTitulo(v);
    // El slug se autogenera del título SOLO al crear, y sólo mientras el
    // artista no haya tocado el campo slug a mano.
    if (modo === 'crear' && !slugTocado) {
      setSlug(slugify(v));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!titulo.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (!imagenUrl) {
      setError('Subí una imagen principal antes de guardar.');
      return;
    }

    setGuardando(true);
    const supabase = createClient();

    const base = {
      titulo: titulo.trim(),
      tecnica: tecnica.trim() || null,
      anio: anio.trim() ? Number(anio) : null,
      dimensiones: dimensiones.trim(),
      descripcion: descripcion.trim(),
      imagen_url: imagenUrl,
      tiene_hover: tieneHover,
      imagen_hover_url: tieneHover ? imagenHoverUrl : null,
      tamano_grilla: tamanoGrilla,
      publicada,
      tiene_pagina_propia: tienePaginaPropia,
      subtitulo_extendido: subtituloExtendido.trim() || null,
      texto_extendido: textoExtendido.trim() || null,
    };

    if (modo === 'crear') {
      const slugFinal = await generarSlugUnico(supabase, slug || slugify(titulo));

      const { data: maxRow } = await supabase
        .from('obras')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nuevoOrden = (maxRow?.orden ?? 0) + 1;

      const { data: creada, error: insertError } = await supabase
        .from('obras')
        .insert({ ...base, slug: slugFinal, orden: nuevoOrden })
        .select('id')
        .single();

      setGuardando(false);

      if (insertError || !creada) {
        setError('No se pudo crear la obra. Probá de nuevo.');
        return;
      }

      router.push(`/panel/obras/${creada.id}`);
      router.refresh();
      return;
    }

    // Editar: el slug lo puede haber tocado el artista a mano. Si choca con
    // el de otra obra, Postgres devuelve una violación de unicidad (23505) —
    // la traducimos a un mensaje que el artista pueda resolver.
    const { error: updateError } = await supabase
      .from('obras')
      .update({ ...base, slug: slug.trim() })
      .eq('id', obraInicial!.id);

    setGuardando(false);

    if (updateError) {
      if (updateError.code === '23505') {
        setError('Ese slug ya lo usa otra obra. Elegí otro.');
      } else {
        setError('No se pudo guardar. Probá de nuevo.');
      }
      return;
    }

    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}
      {ok && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          Guardado.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Datos básicos
        </h2>

        <Campo label="Título" requerido>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => onCambiarTitulo(e.target.value)}
            className="input"
          />
        </Campo>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Técnica">
            <input
              type="text"
              value={tecnica}
              onChange={(e) => setTecnica(e.target.value)}
              className="input"
            />
          </Campo>
          <Campo label="Año">
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="input"
            />
          </Campo>
          <Campo label="Dimensiones">
            <input
              type="text"
              value={dimensiones}
              onChange={(e) => setDimensiones(e.target.value)}
              className="input"
            />
          </Campo>
        </div>

        <Campo label="Descripción" ayuda="Se usa en el overlay de hover de la galería y en el hero de la página individual.">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="input"
          />
        </Campo>

        <Campo label="Slug" ayuda={
          modo === 'crear'
            ? 'Se autogenera del título. Podés editarlo antes de guardar.'
            : 'No se regenera solo al cambiar el título — para no romper un link ya compartido. Editalo a mano si hace falta.'
        }>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTocado(true);
            }}
            className="input font-mono"
          />
        </Campo>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Imagen principal
        </h2>
        <SubidaImagen valor={imagenUrl} onCambiar={setImagenUrl} carpeta="obras" />
      </section>

      <section className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <Toggle
          label="Tiene segunda imagen (hover)"
          ayuda="Muestra una segunda imagen al pasar el mouse en la galería."
          checked={tieneHover}
          onChange={setTieneHover}
        />
        {tieneHover && (
          <SubidaImagen valor={imagenHoverUrl} onCambiar={setImagenHoverUrl} carpeta="obras" />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Tamaño en la grilla
        </h2>
        <div className="flex items-end gap-4">
          {OPCIONES_TAMANO.map((op) => (
            <div key={op.valor} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setTamanoGrilla(op.valor)}
                className={`flex items-center justify-center rounded border-2 p-2 transition-colors ${
                  tamanoGrilla === op.valor
                    ? 'border-slate-700 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className={`bg-slate-400 rounded-sm ${op.forma}`} />
              </button>
              <span className="text-xs text-slate-600">{op.etiqueta}</span>
            </div>
          ))}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 max-w-[16rem]">
            &quot;Chica&quot; recorta fuerte la imagen — conviene para obras horizontales.
          </p>
        </div>
      </section>

      {/* Publicada y tiene_pagina_propia son dos cosas independientes — a
          propósito en cajas separadas con estilos distintos para que no se
          confundan entre sí. */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="border-2 border-sky-200 bg-sky-50 rounded-lg p-4">
          <Toggle
            label="Publicada"
            ayuda="Visible en la galería del sitio público."
            checked={publicada}
            onChange={setPublicada}
          />
        </div>
        <div className="border-2 border-violet-200 bg-violet-50 rounded-lg p-4">
          <Toggle
            label="Tiene página propia"
            ayuda="Esta obra tiene su propia página al hacer click (/obra/[slug])."
            checked={tienePaginaPropia}
            onChange={setTienePaginaPropia}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Contenido extendido (opcional, página individual)
        </h2>
        <Campo
          label="Subtítulo extendido"
          ayuda="Subtítulo que aparece en la página individual de la obra (/obra/[slug]), justo debajo del hero."
        >
          <input
            type="text"
            value={subtituloExtendido}
            onChange={(e) => setSubtituloExtendido(e.target.value)}
            className="input"
          />
        </Campo>
        <Campo
          label="Texto extendido"
          ayuda="Texto largo de la página individual de la obra. Separá párrafos con una línea en blanco (Enter dos veces)."
        >
          <textarea
            value={textoExtendido}
            onChange={(e) => setTextoExtendido(e.target.value)}
            rows={5}
            className="input"
          />
        </Campo>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Galería adicional
        </h2>
        {modo === 'crear' || !obraInicial ? (
          <p className="text-sm text-slate-500">
            Podés agregar imágenes a la galería adicional después de guardar la obra por primera vez.
          </p>
        ) : (
          <ObraGaleria obraId={obraInicial.id} imagenesIniciales={imagenes} onCambiar={setImagenes} />
        )}
      </section>

      <button
        type="submit"
        disabled={guardando}
        className="rounded bg-slate-800 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {guardando ? 'Guardando…' : modo === 'crear' ? 'Crear obra' : 'Guardar cambios'}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.25rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgb(148 163 184);
        }
      `}</style>
    </form>
  );
}

function Campo({
  label,
  ayuda,
  requerido,
  children,
}: {
  label: string;
  ayuda?: string;
  requerido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {requerido && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}
