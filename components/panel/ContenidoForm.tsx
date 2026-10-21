'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CLAVES_CONTENIDO } from '@/lib/mapeo';
import { CAMPOS_CONTENIDO_TRADUCIBLES, type CampoContenidoTraducible, type ContenidoSitio, type ContenidoSitioEn } from '@/lib/tipos';
import type { Idioma } from '@/lib/i18n';
import SubidaImagen from './SubidaImagen';
import CampoBilingue from './CampoBilingue';

export default function ContenidoForm({
  contenidoInicial,
  enInicial,
}: {
  contenidoInicial: ContenidoSitio;
  enInicial: ContenidoSitioEn;
}) {
  const router = useRouter();
  const [contenido, setContenido] = useState<ContenidoSitio>(contenidoInicial);
  // Versión en inglés de los campos traducibles (toggle ES/EN del sitio).
  const [en, setEn] = useState<ContenidoSitioEn>(enInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function set<K extends keyof ContenidoSitio>(campo: K, valor: ContenidoSitio[K]) {
    setContenido((prev) => ({ ...prev, [campo]: valor }));
    setOk(false);
  }

  /** Para los CampoBilingue: escribe el español o el inglés del campo. */
  function setBilingue(campo: CampoContenidoTraducible) {
    return (idioma: Idioma, valor: string) => {
      if (idioma === 'es') set(campo, valor);
      else {
        setEn((prev) => ({ ...prev, [campo]: valor }));
        setOk(false);
      }
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const supabase = createClient();
    const traducibles = new Set<string>(CAMPOS_CONTENIDO_TRADUCIBLES);
    const filas = (Object.keys(CLAVES_CONTENIDO) as (keyof ContenidoSitio)[]).map((campo) => ({
      clave: CLAVES_CONTENIDO[campo],
      valor: contenido[campo] ?? '',
      // valor_en sólo en los campos traducibles (migración 0004).
      ...(traducibles.has(campo) ? { valor_en: en[campo as CampoContenidoTraducible] || null } : {}),
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
        <CampoBilingue
          etiqueta="Subtítulo del hero"
          tipo="linea"
          es={contenido.heroSubtitulo}
          en={en.heroSubtitulo}
          onCambio={setBilingue('heroSubtitulo')}
        />
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
        <CampoBilingue
          etiqueta="Título"
          tipo="linea"
          es={contenido.declaracionTitulo}
          en={en.declaracionTitulo}
          onCambio={setBilingue('declaracionTitulo')}
        />
        <CampoBilingue
          etiqueta="Texto"
          tipo="rico"
          es={contenido.declaracionTexto}
          en={en.declaracionTexto}
          onCambio={setBilingue('declaracionTexto')}
          placeholder="Texto de la declaración…"
          altoMinimo="min-h-[8rem]"
          ayuda="Se corta solo en páginas en el sitio según el largo."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Bio</h2>
        <CampoBilingue
          etiqueta="Texto de bio"
          tipo="rico"
          es={contenido.bioTexto}
          en={en.bioTexto}
          onCambio={setBilingue('bioTexto')}
          placeholder="Texto de bio…"
          altoMinimo="min-h-[12rem]"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">CV</h2>
        <CampoBilingue
          etiqueta="Texto de CV"
          tipo="rico"
          es={contenido.cvTexto}
          en={en.cvTexto}
          onCambio={setBilingue('cvTexto')}
          placeholder="Texto de CV…"
          altoMinimo="min-h-[20rem]"
          ayuda="Este texto se corta solo en páginas en el sitio público según el largo — no te preocupes por dónde cortarlo, escribilo corrido."
        />
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
  sinLabel = false,
  children,
}: {
  label: string;
  ayuda?: string;
  /**
   * Para el editor de texto enriquecido: NO puede ir dentro de un <label>,
   * porque el label reenvía los clicks a su primer control (el botón
   * "Negrita" de la barra) y cada click en el texto activaría la negrita. El
   * editor lleva su propio aria-label.
   */
  sinLabel?: boolean;
  children: React.ReactNode;
}) {
  const Contenedor = sinLabel ? 'div' : 'label';
  return (
    <Contenedor className="block space-y-1">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
    </Contenedor>
  );
}
