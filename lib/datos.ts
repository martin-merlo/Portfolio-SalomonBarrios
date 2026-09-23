import { createPublicClient } from './supabase/publico';
import { CLAVES_CONTENIDO, mapBloque, mapObra, mapProceso } from './mapeo';
import type { Bloque, ContenidoSitio, ImagenProceso, Obra } from './tipos';
import type { BloqueRow, ObraRow, ProcesoRow } from './mapeo';

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
export async function getContenido(): Promise<ContenidoSitio> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('contenido_sitio').select('clave, valor');

  const porClave = new Map<string, string>();
  if (error) {
    console.error('Error al cargar contenido_sitio desde Supabase:', error.message);
  } else {
    for (const fila of data as { clave: string; valor: string | null }[]) {
      porClave.set(fila.clave, fila.valor ?? '');
    }
  }

  const contenido = {} as ContenidoSitio;
  for (const campo of Object.keys(CLAVES_CONTENIDO) as (keyof ContenidoSitio)[]) {
    contenido[campo] = porClave.get(CLAVES_CONTENIDO[campo]) ?? '';
  }
  return contenido;
}
