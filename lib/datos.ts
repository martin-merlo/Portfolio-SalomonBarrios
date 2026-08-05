import { createPublicClient } from './supabase/publico';
import { CLAVES_CONTENIDO, mapObra, mapObraImagen, mapProceso } from './mapeo';
import type { ContenidoSitio, ImagenProceso, Obra, ObraConDetalle } from './tipos';
import type { ObraImagenRow, ObraRow, ProcesoRow } from './mapeo';

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
 * Trae una obra publicada por slug junto con sus imágenes relacionadas
 * (obra_imagenes, ordenadas). Devuelve null si no existe o no está
 * publicada, para que la página de arriba dispare un 404 real con
 * notFound().
 */
export async function getObraBySlug(slug: string): Promise<ObraConDetalle | null> {
  const supabase = createPublicClient();

  const { data: obraRow, error } = await supabase
    .from('obras')
    .select('*')
    .eq('slug', slug)
    .eq('publicada', true)
    .maybeSingle();

  if (error || !obraRow) return null;

  const { data: imagenesRows } = await supabase
    .from('obra_imagenes')
    .select('*')
    .eq('obra_id', obraRow.id)
    .order('orden', { ascending: true });

  return {
    ...mapObra(obraRow as ObraRow),
    imagenes: ((imagenesRows as ObraImagenRow[]) ?? []).map(mapObraImagen),
  };
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
