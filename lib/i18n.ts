import type { Bloque, ContenidoSitio, ContenidoSitioEn, ImagenProceso, Obra } from './tipos';
import { CAMPOS_CONTENIDO_TRADUCIBLES } from './tipos';

/**
 * Idioma del sitio público (toggle ES/EN). Sirve en cliente y servidor.
 *
 * - El idioma elegido se guarda en la cookie COOKIE_IDIOMA (misma URL para los
 *   dos idiomas). Sin cookie, se detecta del navegador (Accept-Language): si
 *   el visitante tiene el navegador en español entra en español; en cualquier
 *   otro idioma, en inglés. Ver lib/idioma.ts (lado servidor).
 * - Textos fijos del sitio: DICCIONARIO.
 * - Textos que carga el artista: cada uno tiene su versión *En opcional; si
 *   está vacía se muestra el español (localizar*).
 */

export type Idioma = 'es' | 'en';
export const IDIOMAS: Idioma[] = ['es', 'en'];
export const COOKIE_IDIOMA = 'idioma';

export function esIdioma(v: unknown): v is Idioma {
  return v === 'es' || v === 'en';
}

/** Idioma por defecto según el Accept-Language del navegador. */
export function detectarIdioma(acceptLanguage: string | null | undefined): Idioma {
  const primero = (acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  if (!primero || primero.startsWith('es')) return 'es';
  return 'en';
}

export const DICCIONARIO = {
  es: {
    metaTitulo: 'Salomón Barrios — Artista Digital, pintor',
    metaDescripcion: 'Portfolio de Salomón Barrios, artista digital y pintor.',
    nav: { bio: 'BIO', work: 'WORK', contacto: 'CONTACTO', cv: 'CV' },
    labels: { bio: 'bio.1', work: 'work.2', contacto: 'Contacto.3', cv: 'CV.4' },
    idioma: 'Idioma',
    verObra: 'Ver obra',
    videoDeLaObra: 'Video de la obra',
    procesoDeTrabajo: 'Proceso de trabajo',
    firma: 'Firma de Salomón Barrios',
    paginaAnterior: 'Página anterior',
    paginaSiguiente: 'Página siguiente',
    pagina: 'Página',
    paginasCv: 'Páginas del CV',
    paginasDeclaracion: 'Páginas de la declaración del artista',
    cargando: 'Cargando',
  },
  en: {
    metaTitulo: 'Salomón Barrios — Digital artist, painter',
    metaDescripcion: 'Portfolio of Salomón Barrios, digital artist and painter.',
    nav: { bio: 'BIO', work: 'WORK', contacto: 'CONTACT', cv: 'CV' },
    labels: { bio: 'bio.1', work: 'work.2', contacto: 'Contact.3', cv: 'CV.4' },
    idioma: 'Language',
    verObra: 'View work',
    videoDeLaObra: 'Video of the work',
    procesoDeTrabajo: 'Work process',
    firma: 'Signature of Salomón Barrios',
    paginaAnterior: 'Previous page',
    paginaSiguiente: 'Next page',
    pagina: 'Page',
    paginasCv: 'CV pages',
    paginasDeclaracion: 'Artist statement pages',
    cargando: 'Loading',
  },
} as const;

export type Textos = (typeof DICCIONARIO)[Idioma];

export function textos(idioma: Idioma): Textos {
  return DICCIONARIO[idioma];
}

/** El inglés si hay (no vacío) y se pidió inglés; si no, el español. */
export function elegir<T extends string | null>(es: T, en: string | null | undefined, idioma: Idioma): T | string {
  return idioma === 'en' && en && en.trim() ? en : es;
}

export function localizarObra(o: Obra, idioma: Idioma): Obra {
  if (idioma === 'es') return o;
  return {
    ...o,
    titulo: elegir(o.titulo, o.tituloEn, idioma),
    tecnica: elegir(o.tecnica, o.tecnicaEn, idioma),
    descripcion: elegir(o.descripcion, o.descripcionEn, idioma),
    subtituloExtendido: elegir(o.subtituloExtendido, o.subtituloExtendidoEn, idioma),
  };
}

export function localizarBloque(b: Bloque, idioma: Idioma): Bloque {
  if (idioma === 'es') return b;
  return { ...b, titulo: elegir(b.titulo, b.tituloEn, idioma), contenido: elegir(b.contenido, b.contenidoEn, idioma) };
}

export function localizarProceso(p: ImagenProceso, idioma: Idioma): ImagenProceso {
  if (idioma === 'es') return p;
  return { ...p, textoCorto: elegir(p.textoCorto, p.textoCortoEn, idioma) };
}

export function localizarContenido(c: ContenidoSitio, en: ContenidoSitioEn, idioma: Idioma): ContenidoSitio {
  if (idioma === 'es') return c;
  const out = { ...c };
  for (const campo of CAMPOS_CONTENIDO_TRADUCIBLES) out[campo] = elegir(c[campo], en[campo], idioma);
  return out;
}
