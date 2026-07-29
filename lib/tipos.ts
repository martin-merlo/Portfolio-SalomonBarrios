export type TamanoGrilla = 'normal' | 'banner' | 'chica';

export interface Obra {
  id: string;
  titulo: string;
  tecnica: string;
  anio: number;
  dimensiones: string;
  descripcion: string;
  imagenUrl: string;
  tieneHover: boolean;
  imagenHoverUrl: string | null;
  tamanoGrilla: TamanoGrilla;
  orden: number;
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
  declaracionTexto: string;
  bioTexto: string;
  cvTexto: string;
  contactoTelefono: string;
  contactoEmail: string;
  instagramUrl: string;
  tiktokUrl: string;
}
