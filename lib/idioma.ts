import { cookies, headers } from 'next/headers';
import { COOKIE_IDIOMA, detectarIdioma, esIdioma, type Idioma } from './i18n';

/**
 * Idioma de la request actual (lado servidor): la cookie que escribe el toggle
 * ES/EN, o, si el visitante todavía no eligió, el idioma de su navegador.
 * Leer cookies/headers hace que la página se renderice por request (no
 * estática): es lo que permite servir cada idioma en la misma URL.
 */
export async function getIdioma(): Promise<Idioma> {
  const elegido = (await cookies()).get(COOKIE_IDIOMA)?.value;
  if (esIdioma(elegido)) return elegido;
  return detectarIdioma((await headers()).get('accept-language'));
}
