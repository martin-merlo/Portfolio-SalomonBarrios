import sanitizeHtml from 'sanitize-html';
import { normalizarContenido } from './textoRico';

/**
 * Sanitiza el HTML de los textos enriquecidos (bloques de texto de obra, Bio,
 * CV y declaración del artista) antes de renderizarlo. SÓLO del lado del
 * servidor: los componentes de cliente (CV y declaración, que paginan) reciben
 * el HTML ya sanitizado por su padre server component. Defensa contra XSS: el
 * HTML viene de la base, así que no se confía en que lo haya generado el
 * editor — se permite SÓLO lo que producen los 5 botones del panel.
 *
 * - Etiquetas: p, br (párrafos y salto con Shift+Enter), strong, em, ul, ol,
 *   li, a. Todo lo demás se descarta; su texto queda como texto (script, style
 *   y similares se eliminan con contenido incluido).
 * - Atributos: ninguno, salvo href en <a>, y sólo con http, https o mailto
 *   (nada de javascript:, data:, ni URLs protocol-relative).
 * - Links: target/rel NO se toman del HTML guardado, se recalculan acá. Los
 *   externos (http/https) abren en pestaña nueva con rel="noopener noreferrer";
 *   los relativos (/obra/…) y mailto: abren normal.
 */
const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  // Párrafos sin texto (<p></p>, típico al final del editor): fuera. Sumaban un
  // margen vacío debajo del bloque; el formato viejo tampoco tenía líneas en
  // blanco de más. (trim() ya descarta el &nbsp; — U+00A0 es whitespace en JS.)
  exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim(),
  transformTags: {
    b: 'strong',
    i: 'em',
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const limpios: sanitizeHtml.Attributes = {};
      if (href) limpios.href = href;
      if (/^https?:\/\//i.test(href.trim())) {
        limpios.target = '_blank';
        limpios.rel = 'noopener noreferrer';
      }
      return { tagName, attribs: limpios };
    },
  },
};

export function sanitizarHtmlRico(contenido: string | null | undefined): string {
  return sanitizeHtml(normalizarContenido(contenido), OPCIONES);
}

/** true si el HTML ya sanitizado no tiene texto visible (p. ej. "<p></p>"). */
export function htmlVacio(html: string): boolean {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, ' ').trim() === '';
}
