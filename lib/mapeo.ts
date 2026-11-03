import type { Bloque, ContenidoSitio, ImagenProceso, Obra } from './tipos';

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
  // Inglés (migración 0004). Opcionales: antes de correr la migración no vienen.
  titulo_en?: string | null;
  tecnica_en?: string | null;
  descripcion_en?: string | null;
  subtitulo_extendido_en?: string | null;
  // texto_extendido y obra_imagenes se retiraron (los reemplazan obra_bloques):
  // la columna texto_extendido puede seguir en la base sin uso, pero el código
  // ya no la mapea.
};

export type ProcesoRow = {
  id: string;
  imagen_url: string;
  texto_corto: string;
  orden: number;
  texto_corto_en?: string | null;
};

export type BloqueRow = {
  id: string;
  obra_id: string;
  tipo: Bloque['tipo'];
  orden: number;
  contenido: string | null;
  titulo: string | null;
  imagen_url: string | null;
  tamano: Bloque['tamano'];
  video_url: string | null;
  video_ancho: number | null;
  titulo_en?: string | null;
  contenido_en?: string | null;
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
    tituloEn: row.titulo_en ?? null,
    tecnicaEn: row.tecnica_en ?? null,
    descripcionEn: row.descripcion_en ?? null,
    subtituloExtendidoEn: row.subtitulo_extendido_en ?? null,
  };
}

export function mapProceso(row: ProcesoRow): ImagenProceso {
  return {
    id: row.id,
    imagenUrl: row.imagen_url,
    textoCorto: row.texto_corto,
    orden: row.orden,
    textoCortoEn: row.texto_corto_en ?? null,
  };
}

export function mapBloque(row: BloqueRow): Bloque {
  return {
    id: row.id,
    obraId: row.obra_id,
    tipo: row.tipo,
    orden: row.orden,
    contenido: row.contenido,
    titulo: row.titulo,
    imagenUrl: row.imagen_url,
    tamano: row.tamano,
    videoUrl: row.video_url,
    videoAncho: row.video_ancho,
    tituloEn: row.titulo_en ?? null,
    contenidoEn: row.contenido_en ?? null,
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
  bioImagenUrl: 'bio_imagen_url',
  bioImagenAncho: 'bio_imagen_ancho',
  bioImagenAlto: 'bio_imagen_alto',
  bioImagenAlt: 'bio_imagen_alt',
  cvTexto: 'cv_texto',
  contactoTelefono: 'contacto_telefono',
  contactoEmail: 'contacto_email',
  instagramUrl: 'instagram_url',
  tiktokUrl: 'tiktok_url',
};
