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
  // Versión en inglés (toggle ES/EN). null/vacío = se muestra el español.
  tituloEn: string | null;
  tecnicaEn: string | null;
  descripcionEn: string | null;
  subtituloExtendidoEn: string | null;
}

export type TipoBloque = 'texto' | 'imagen' | 'video';
// Mismo vocabulario que el tamaño de grilla de las obras del home (chica /
// normal / banner), para que sea un solo sistema.
export type TamanoBloque = 'chica' | 'normal' | 'banner';

/**
 * Bloque de contenido flexible de una página de obra (tabla obra_bloques). Es
 * el contenido libre debajo del subtítulo. Según el tipo se llenan campos
 * distintos:
 *   texto  → contenido (+ titulo opcional, encabezado arriba del texto);
 *   imagen → imagenUrl + tamano (chica / normal / banner);
 *   video  → videoUrl + videoAncho (% de la columna: 25 / 50 / 75 / 100).
 * Los campos no usados por un tipo quedan null.
 */
export interface Bloque {
  id: string;
  obraId: string;
  tipo: TipoBloque;
  orden: number;
  contenido: string | null;
  titulo: string | null;
  imagenUrl: string | null;
  tamano: TamanoBloque | null;
  videoUrl: string | null;
  videoAncho: number | null;
  // Versión en inglés (sólo bloques de texto). null/vacío = español.
  tituloEn: string | null;
  contenidoEn: string | null;
}

export interface ImagenProceso {
  id: string;
  imagenUrl: string;
  textoCorto: string;
  orden: number;
  /** Versión en inglés del texto corto. null/vacío = español. */
  textoCortoEn: string | null;
}

export interface ContenidoSitio {
  heroTitulo: string;
  heroSubtitulo: string;
  heroImagenUrl: string;
  declaracionTitulo: string;
  declaracionTexto: string;
  bioTexto: string;
  // Foto de la bio. Ancho y alto: px de la imagen ya comprimida (como texto,
  // porque contenido_sitio es clave/valor); reservan el espacio en el sitio.
  bioImagenUrl: string;
  bioImagenAncho: string;
  bioImagenAlto: string;
  bioImagenAlt: string;
  cvTexto: string;
  contactoTelefono: string;
  contactoEmail: string;
  instagramUrl: string;
  tiktokUrl: string;
}

/**
 * Campos de ContenidoSitio que tienen versión en inglés (columna valor_en de
 * contenido_sitio). El resto (nombre, imagen, contacto, redes) no se traduce.
 */
export const CAMPOS_CONTENIDO_TRADUCIBLES = [
  'heroSubtitulo',
  'declaracionTitulo',
  'declaracionTexto',
  'bioTexto',
  'bioImagenAlt',
  'cvTexto',
] as const;
export type CampoContenidoTraducible = (typeof CAMPOS_CONTENIDO_TRADUCIBLES)[number];
/** Versión en inglés de los campos traducibles ('' = sin traducir todavía). */
export type ContenidoSitioEn = Record<CampoContenidoTraducible, string>;
