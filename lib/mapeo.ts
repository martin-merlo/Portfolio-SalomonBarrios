import type { ContenidoSitio, ImagenProceso, Obra, ObraImagen } from './tipos';

/**
 * Filas crudas de Supabase (snake_case) y su mapeo a los tipos camelCase que
 * usa el resto de la app. Vive en un módulo aparte porque tanto el sitio
 * público (lib/datos.ts) como el panel (lib/panel/datos.ts) lo necesitan.
 */

export type ObraRow = {
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

export type ObraImagenRow = {
  id: string;
  imagen_url: string;
  orden: number;
};

export type ProcesoRow = {
  id: string;
  imagen_url: string;
  texto_corto: string;
  orden: number;
};

export function mapObra(row: ObraRow): Obra {
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

export function mapObraImagen(row: ObraImagenRow): ObraImagen {
  return {
    id: row.id,
    imagenUrl: row.imagen_url,
    orden: row.orden,
  };
}

export function mapProceso(row: ProcesoRow): ImagenProceso {
  return {
    id: row.id,
    imagenUrl: row.imagen_url,
    textoCorto: row.texto_corto,
    orden: row.orden,
  };
}

/** Campo del tipo ContenidoSitio -> clave de la fila en contenido_sitio. */
export const CLAVES_CONTENIDO: Record<keyof ContenidoSitio, string> = {
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
