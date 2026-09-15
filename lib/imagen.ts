/**
 * Los mocks usan gradientes CSS como placeholder de imagenUrl; cuando lleguen
 * URLs reales (Supabase Storage) este helper sigue funcionando sin cambios.
 */
export function fondoImagen(valor: string): string {
  return valor.includes('gradient(') ? valor : `url(${valor})`;
}

/**
 * Máscara del borde inferior del hero: recorta el pie del hero con la misma ola
 * del papel (forma-recorte-hero.png = forma-recorte.png volteada verticalmente
 * y recortada, con la ola al pie) para que en el ESTADO INICIAL —sin scrollear—
 * ya se vea el borde ondulado asomando en vez de un corte recto.
 *
 * No toca la animación de scroll: la caja del hero conserva su altura (el
 * mask solo cambia qué se pinta, no el layout), así que el papel sigue subiendo
 * a taparlo igual que antes y Navbar/BordeOrnamental miden lo mismo. Compartida
 * entre Hero (home) y ObraHero (/obra/[slug]). mask-size 100% 100% estira la
 * máscara a la altura real del hero en cualquier viewport, dejando la ola
 * siempre al pie.
 */
export const heroMaskStyle = {
  WebkitMaskImage: "url('/imagenes/forma-recorte-hero.png')",
  maskImage: "url('/imagenes/forma-recorte-hero.png')",
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
} as const;
