import { createPublicClient } from './supabase/publico';
import type { ContenidoSitio, ImagenProceso, Obra, ObraConDetalle, ObraImagen } from './tipos';

type ObraRow = {
  id: string;
  slug: string;
  titulo: string;
  tecnica: string | null;
  anio: number | null;
  dimensiones: string;
  descripcion: string;
  imagen_url: string;
  tiene_hover: boolean;
  imagen_hover_url: string | null;
  tamano_grilla: Obra['tamanoGrilla'];
  orden: number;
  tiene_pagina_propia: boolean;
  publicada: boolean;
  subtitulo_extendido: string | null;
  texto_extendido: string | null;
};

type ObraImagenRow = {
  id: string;
  imagen_url: string;
  orden: number;
};

type ProcesoRow = {
  id: string;
  imagen_url: string;
  texto_corto: string;
  orden: number;
};

function mapObra(row: ObraRow): Obra {
  return {
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    tecnica: row.tecnica,
    anio: row.anio,
    dimensiones: row.dimensiones,
    descripcion: row.descripcion,
    imagenUrl: row.imagen_url,
    tieneHover: row.tiene_hover,
    imagenHoverUrl: row.imagen_hover_url,
    tamanoGrilla: row.tamano_grilla,
    orden: row.orden,
    tienePaginaPropia: row.tiene_pagina_propia,
    publicada: row.publicada,
    subtituloExtendido: row.subtitulo_extendido,
    textoExtendido: row.texto_extendido,
  };
}

function mapObraImagen(row: ObraImagenRow): ObraImagen {
  return {
    id: row.id,
    imagenUrl: row.imagen_url,
    orden: row.orden,
  };
}

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

  return (data as ProcesoRow[]).map((row) => ({
    id: row.id,
    imagenUrl: row.imagen_url,
    textoCorto: row.texto_corto,
    orden: row.orden,
  }));
}

/** Mapa campo del tipo ContenidoSitio -> clave de la fila en contenido_sitio. */
const CLAVES_CONTENIDO: Record<keyof ContenidoSitio, string> = {
  heroTitulo: 'hero_titulo',
  heroSubtitulo: 'hero_subtitulo',
  heroImagenUrl: 'hero_imagen_url',
  declaracionTitulo: 'declaracion_titulo',
  declaracionTexto: 'declaracion_texto',
  bioTexto: 'bio_texto',
  cvTexto: 'cv_texto',
  contactoTelefono: 'contacto_telefono',
  contactoEmail: 'contacto_email',
  instagramUrl: 'instagram_url',
  tiktokUrl: 'tiktok_url',
};

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
