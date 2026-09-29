/**
 * Texto enriquecido de los bloques de texto de obra (obra_bloques.contenido).
 *
 * Desde que el panel usa Tiptap, `contenido` guarda HTML (editor.getHTML()).
 * Los bloques anteriores guardan TEXTO PLANO, que no es HTML válido tal cual:
 * los párrafos se separaban con una línea en blanco (\n\n) y un "<" o "&" del
 * texto se interpretaría como marcado. Por eso todo lo que lee `contenido` pasa
 * por normalizarContenido(): si ya es HTML del editor lo deja, y si es texto
 * plano lo convierte (escapado + un <p> por párrafo, <br> por salto simple).
 *
 * Sin dependencias: lo usan el editor del panel (cliente) y el render de la
 * página de obra (servidor, que además sanitiza — ver lib/sanitizarHtml.ts).
 */

// Tiptap siempre exporta bloques de primer nivel: <p>, <ul> u <ol>.
const INICIO_HTML_EDITOR = /^\s*<(p|ul|ol)[\s>]/i;

export function esHtmlDelEditor(contenido: string): boolean {
  return INICIO_HTML_EDITOR.test(contenido);
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Texto plano (formato viejo) → HTML equivalente al render anterior. */
export function textoPlanoAHtml(texto: string): string {
  return texto
    .trim()
    .split(/\n{2,}/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean)
    .map((parrafo) => `<p>${escapar(parrafo).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function normalizarContenido(contenido: string | null | undefined): string {
  if (!contenido?.trim()) return '';
  return esHtmlDelEditor(contenido) ? contenido : textoPlanoAHtml(contenido);
}
