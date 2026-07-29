/**
 * Los mocks usan gradientes CSS como placeholder de imagenUrl; cuando lleguen
 * URLs reales (Supabase Storage) este helper sigue funcionando sin cambios.
 */
export function fondoImagen(valor: string): string {
  return valor.includes('gradient(') ? valor : `url(${valor})`;
}
