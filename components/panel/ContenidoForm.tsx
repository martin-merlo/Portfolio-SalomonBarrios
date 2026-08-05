'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CLAVES_CONTENIDO } from '@/lib/mapeo';
import type { ContenidoSitio } from '@/lib/tipos';
import SubidaImagen from './SubidaImagen';

export default function ContenidoForm({ contenidoInicial }: { contenidoInicial: ContenidoSitio }) {
  const router = useRouter();
  const [contenido, setContenido] = useState<ContenidoSitio>(contenidoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function set<K extends keyof ContenidoSitio>(campo: K, valor: ContenidoSitio[K]) {
    setContenido((prev) => ({ ...prev, [campo]: valor }));
    setOk(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const supabase = createClient();
    const filas = (Object.keys(CLAVES_CONTENIDO) as (keyof ContenidoSitio)[]).map((campo) => ({
      clave: CLAVES_CONTENIDO[campo],
      valor: contenido[campo] ?? '',
    }));

    const { error: upsertError } = await supabase
      .from('contenido_sitio')
      .upsert(filas, { onConflict: 'clave' });

    setGuardando(false);

    if (upsertError) {
      setError('No se pudo guardar. Probá de nuevo.');
      return;
    }

    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
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
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Hero</h2>
        <Campo label="Título del hero">
          <input
            type="text"
            value={contenido.heroTitulo}
            onChange={(e) => set('heroTitulo', e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Subtítulo del hero">
          <input
            type="text"
            value={contenido.heroSubtitulo}
            onChange={(e) => set('heroSubtitulo', e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Imagen de fondo del hero">
          <SubidaImagen
            valor={contenido.heroImagenUrl || null}
            onCambiar={(url) => set('heroImagenUrl', url)}
            carpeta="general"
          />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Declaración del artista
        </h2>
        <Campo label="Título">
          <input
            type="text"
            value={contenido.declaracionTitulo}
            onChange={(e) => set('declaracionTitulo', e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Texto">
          <textarea
            value={contenido.declaracionTexto}
            onChange={(e) => set('declaracionTexto', e.target.value)}
            rows={4}
            className="input"
          />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Bio</h2>
        <Campo label="Texto de bio">
          <textarea
            value={contenido.bioTexto}
            onChange={(e) => set('bioTexto', e.target.value)}
            rows={8}
            className="input"
          />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">CV</h2>
        <Campo
          label="Texto de CV"
          ayuda="Este texto se corta solo en páginas en el sitio público según el largo — no te preocupes por dónde cortarlo, escribilo corrido."
        >
          <textarea
            value={contenido.cvTexto}
            onChange={(e) => set('cvTexto', e.target.value)}
            rows={14}
            className="input"
          />
        </Campo>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contacto</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Teléfono">
            <input
              type="text"
              value={contenido.contactoTelefono}
              onChange={(e) => set('contactoTelefono', e.target.value)}
              className="input"
            />
          </Campo>
          <Campo label="Email">
            <input
              type="email"
              value={contenido.contactoEmail}
              onChange={(e) => set('contactoEmail', e.target.value)}
              className="input"
            />
          </Campo>
          <Campo label="Instagram (URL)">
            <input
              type="url"
              value={contenido.instagramUrl}
              onChange={(e) => set('instagramUrl', e.target.value)}
              className="input"
            />
          </Campo>
          <Campo label="TikTok (URL)">
            <input
              type="url"
              value={contenido.tiktokUrl}
              onChange={(e) => set('tiktokUrl', e.target.value)}
              className="input"
            />
          </Campo>
        </div>
      </section>

      <button
        type="submit"
        disabled={guardando}
        className="rounded bg-slate-800 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {guardando ? 'Guardando…' : 'Guardar'}
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
  children,
}: {
  label: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
    </label>
  );
}
