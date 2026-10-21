'use client';

import { useState } from 'react';
import type { Idioma } from '@/lib/i18n';
import EditorTextoRico from './EditorTextoRico';

/**
 * Campo de texto con versión en español e inglés (toggle ES/EN del sitio).
 * Pestañas Español | English; en English, "Traducir del español" llama a
 * /api/traducir (DeepL) y completa el inglés, que el artista revisa y corrige.
 * Si el inglés queda vacío, el sitio muestra el español.
 *
 * - tipo 'linea' (input), 'parrafo' (textarea) o 'rico' (EditorTextoRico; se
 *   traduce como HTML para conservar negritas, listas y links).
 * - onCambio: en cada cambio (formularios que guardan con un botón).
 * - onGuardar: al salir del campo y al traducir (formularios que persisten
 *   cada campo al toque, como los bloques de obra y el carrusel).
 * Va en un <div>, no en un <label>: con el editor enriquecido adentro, el
 * label reenviaría los clicks al primer botón de la barra.
 */
export default function CampoBilingue({
  etiqueta,
  ayuda,
  tipo,
  es,
  en,
  onCambio,
  onGuardar,
  placeholder,
  requerido = false,
  filas = 3,
  altoMinimo,
}: {
  etiqueta: string;
  ayuda?: string;
  tipo: 'linea' | 'parrafo' | 'rico';
  es: string;
  en: string;
  onCambio: (idioma: Idioma, valor: string) => void;
  onGuardar?: (idioma: Idioma, valor: string) => void;
  placeholder?: string;
  requerido?: boolean;
  filas?: number;
  altoMinimo?: string;
}) {
  const [pestana, setPestana] = useState<Idioma>('es');
  const [traduciendo, setTraduciendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cambia cuando llega una traducción: vuelve a montar el editor enriquecido
  // del inglés con el contenido nuevo.
  const [versionEn, setVersionEn] = useState(0);

  const sinTraducir = !en.trim() || en.trim() === '<p></p>';
  const claseInput = 'w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';

  async function traducir() {
    setError(null);
    if (!es.trim()) {
      setError('Primero escribí el texto en español.');
      return;
    }
    if (!sinTraducir && !window.confirm('¿Reemplazar el inglés actual por una traducción automática nueva?')) return;
    setTraduciendo(true);
    try {
      const r = await fetch('/api/traducir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: es, html: tipo === 'rico' }),
      });
      const datos = (await r.json()) as { traduccion?: string; error?: string };
      if (!r.ok || datos.error) {
        setError(datos.error ?? 'No se pudo traducir.');
        return;
      }
      const traduccion = datos.traduccion ?? '';
      onCambio('en', traduccion);
      onGuardar?.('en', traduccion);
      setVersionEn((v) => v + 1);
    } catch {
      setError('No se pudo conectar para traducir. Probá de nuevo.');
    } finally {
      setTraduciendo(false);
    }
  }

  function campo(idioma: Idioma) {
    const valor = idioma === 'es' ? es : en;
    const ph = idioma === 'es' ? placeholder : placeholder ? `${placeholder} (English)` : 'English';
    if (tipo === 'rico') {
      return (
        <EditorTextoRico
          key={idioma === 'en' ? `en-${versionEn}` : 'es'}
          valorInicial={valor || null}
          onCambio={(html) => onCambio(idioma, html ?? '')}
          onGuardar={onGuardar ? (html) => onGuardar(idioma, html ?? '') : undefined}
          etiqueta={`${etiqueta} (${idioma === 'es' ? 'español' : 'inglés'})`}
          placeholder={ph ?? ''}
          altoMinimo={altoMinimo}
        />
      );
    }
    const comunes = {
      value: valor,
      placeholder: ph,
      'aria-label': `${etiqueta} (${idioma === 'es' ? 'español' : 'inglés'})`,
      lang: idioma,
      className: claseInput,
      onBlur: onGuardar ? () => onGuardar(idioma, valor) : undefined,
    };
    return tipo === 'parrafo' ? (
      <textarea {...comunes} rows={filas} onChange={(e) => onCambio(idioma, e.target.value)} />
    ) : (
      <input {...comunes} type="text" onChange={(e) => onCambio(idioma, e.target.value)} />
    );
  }

  return (
    <div className="block space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">
          {etiqueta}
          {requerido && <span className="text-red-600"> *</span>}
        </span>
        <div role="tablist" aria-label={`Idioma de ${etiqueta}`} className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
          {(['es', 'en'] as const).map((op) => (
            <button
              key={op}
              type="button"
              role="tab"
              aria-selected={pestana === op}
              onClick={() => setPestana(op)}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                pestana === op ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {op === 'es' ? 'Español' : 'English'}
              {op === 'en' && sinTraducir && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" title="Sin traducir" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Los dos campos quedan montados (el editor enriquecido conserva su
          estado); sólo se muestra el de la pestaña activa. */}
      <div className={pestana === 'es' ? '' : 'hidden'}>{campo('es')}</div>
      <div className={pestana === 'en' ? 'space-y-2' : 'hidden'}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={traducir}
            disabled={traduciendo}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {traduciendo ? 'Traduciendo…' : 'Traducir del español'}
          </button>
          <span className="text-xs text-slate-500">
            {sinTraducir
              ? 'Sin traducir: en el sitio en inglés se muestra el español.'
              : 'Revisá la traducción y corregí lo que haga falta.'}
          </span>
        </div>
        {campo('en')}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ayuda && <span className="block text-xs text-slate-500">{ayuda}</span>}
    </div>
  );
}
