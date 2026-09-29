/**
 * Margen lateral del contenido que vive sobre el papel (dentro de PaperSurface).
 * Está ACOPLADO al ancho del borde ornamental (BordeOrnamental): la tira mide
 * 56 / 110 / 160px y su dibujo ocupa sólo la mitad exterior → 28 / 55 / 80px de
 * ornamento visible. El contenido arranca apenas después del ornamento, así ni
 * el texto, ni los cuadros de Bio/CV, ni las cards de la grilla quedan encima
 * del dibujo:
 *   - sm (640+):  64px  (ornamento 55 → 9px de aire)
 *   - lg (1024+): 96px  (ornamento 80 → 16px de aire)
 *   - mobile:     20px  (se deja como estaba para no achicar la columna; el
 *                 ornamento de 28px se superpone ~8px, igual que antes del
 *                 cambio — el texto largo va dentro de los cuadros sólidos).
 * Si se cambia el ancho del borde, revisar esto. A partir de ~1690px de ancho
 * manda el max-w-[1500px] del contenido y el margen queda de sobra.
 */
export const MARGEN_PAPEL = 'px-5 sm:px-16 lg:px-24';
