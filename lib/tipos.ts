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
  // Subtítulo de la página individual (encabezado de la sección de contenido
  // extendido, arriba de los bloques). Se queda como campo fijo.
  subtituloExtendido: string | null;
}

export type TipoBloque = 'texto' | 'imagen' | 'video';
export type TamanoBloque = 'chica' | 'mediana' | 'banner';

/**
 * Bloque de contenido flexible de una página de obra (tabla obra_bloques). Es
 * el contenido libre debajo del subtítulo: reemplazó a texto_extendido y a la
 * galería obra_imagenes (retirados). Según el tipo se llenan campos distintos:
 * texto → contenido; imagen → imagenUrl + tamano; video → videoUrl. Los campos
 * no usados por un tipo quedan null.
 */
export interface Bloque {
  id: string;
  obraId: string;
  tipo: TipoBloque;
  orden: number;
  contenido: string | null;
  imagenUrl: string | null;
  tamano: TamanoBloque | null;
  videoUrl: string | null;
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
