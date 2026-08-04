export type TamanoGrilla = 'normal' | 'banner' | 'chica';

export interface Obra {
  id: string;
  slug: string;
  titulo: string;
  tecnica: string | null;
  anio: number | null;
  dimensiones: string;
  descripcion: string;
  imagenUrl: string;
  tieneHover: boolean;
  imagenHoverUrl: string | null;
  tamanoGrilla: TamanoGrilla;
  orden: number;
  tienePaginaPropia: boolean;
  publicada: boolean;
  subtituloExtendido: string | null;
  textoExtendido: string | null;
}

/** Fila de la galería secundaria de imágenes de una obra (obra_imagenes). */
export interface ObraImagen {
  id: string;
  imagenUrl: string;
  orden: number;
}

/** Lo que devuelve getObraBySlug: la obra más sus imágenes relacionadas. */
export interface ObraConDetalle extends Obra {
  imagenes: ObraImagen[];
}

export interface ImagenProceso {
  id: string;
  imagenUrl: string;
  textoCorto: string;
  orden: number;
}

export interface ContenidoSitio {
  heroTitulo: string;
  heroSubtitulo: string;
  heroImagenUrl: string;
  declaracionTitulo: string;
  declaracionTexto: string;
  bioTexto: string;
  cvTexto: string;
  contactoTelefono: string;
  contactoEmail: string;
  instagramUrl: string;
  tiktokUrl: string;
}
