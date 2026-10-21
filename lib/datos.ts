import { createPublicClient } from './supabase/publico';
import { CLAVES_CONTENIDO, mapBloque, mapObra, mapProceso } from './mapeo';
import type { Bloque, ContenidoSitio, ContenidoSitioEn, ImagenProceso, Obra } from './tipos';
import { CAMPOS_CONTENIDO_TRADUCIBLES } from './tipos';
import type { BloqueRow, ObraRow, ProcesoRow } from './mapeo';
import { localizarContenido, type Idioma } from './i18n';

export async function getObras(): Promise<Obra[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .eq('publicada', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar obras desde Supabase:', error.message);
    return [];
  }

  return (data as ObraRow[]).map(mapObra);
}

/**
 * Trae una obra publicada por slug. Devuelve null si no existe o no está
 * publicada, para que la página de arriba dispare un 404 real con notFound().
 * El contenido extendido (subtítulo + bloques) se trae aparte: el subtítulo ya
 * viene en la obra, y los bloques con getBloquesDeObra.
 */
export async function getObraBySlug(slug: string): Promise<Obra | null> {
  const supabase = createPublicClient();

  const { data: obraRow, error } = await supabase
    .from('obras')
    .select('*')
    .eq('slug', slug)
    .eq('publicada', true)
    .maybeSingle();

  if (error || !obraRow) return null;

  return mapObra(obraRow as ObraRow);
}

/**
 * Bloques de contenido flexible de una obra (obra_bloques), ordenados por
 * `orden`. Es el contenido libre de la página individual, debajo del subtítulo
 * (reemplazó a texto_extendido y a la galería obra_imagenes).
 */
export async function getBloquesDeObra(obraId: string): Promise<Bloque[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('obra_bloques')
    .select('*')
    .eq('obra_id', obraId)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar bloques desde Supabase:', error.message);
    return [];
  }

  return (data as BloqueRow[]).map(mapBloque);
}

export async function getProceso(): Promise<ImagenProceso[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('proceso')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar proceso desde Supabase:', error.message);
    return [];
  }

  return (data as ProcesoRow[]).map(mapProceso);
}

/**
 * contenido_sitio es una tabla clave/valor (una fila por campo). Se arma acá
 * como el objeto plano que espera el resto de la app; las claves ausentes
 * (contenido que el artista todavía no cargó desde el panel) caen a ''.
 */
export async function getContenidoCompleto(): Promise<{ es: ContenidoSitio; en: ContenidoSitioEn }> {
  const supabase = createPublicClient();
  // select('*'): valor_en (migración 0004) aparece sólo si ya existe la columna.
  const { data, error } = await supabase.from('contenido_sitio').select('*');

  const porClave = new Map<string, { valor: string; valorEn: string }>();
  if (error) {
    console.error('Error al cargar contenido_sitio desde Supabase:', error.message);
  } else {
    for (const fila of data as { clave: string; valor: string | null; valor_en?: string | null }[]) {
      porClave.set(fila.clave, { valor: fila.valor ?? '', valorEn: fila.valor_en ?? '' });
    }
  }

  const es = {} as ContenidoSitio;
  for (const campo of Object.keys(CLAVES_CONTENIDO) as (keyof ContenidoSitio)[]) {
    es[campo] = porClave.get(CLAVES_CONTENIDO[campo])?.valor ?? '';
  }
  const en = {} as ContenidoSitioEn;
  for (const campo of CAMPOS_CONTENIDO_TRADUCIBLES) {
    en[campo] = porClave.get(CLAVES_CONTENIDO[campo])?.valorEn ?? '';
  }
  return { es, en };
}

/** Contenido en el idioma pedido (lo que falte en inglés cae al español). */
export async function getContenido(idioma: Idioma = 'es'): Promise<ContenidoSitio> {
  const { es, en } = await getContenidoCompleto();
  return localizarContenido(es, en, idioma);
}
