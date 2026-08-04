import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase para lecturas públicas y anónimas en el servidor
 * (obras publicadas, proceso, contenido del sitio). A propósito NO usa
 * cookies (a diferencia de lib/supabase/server.ts): llamar a cookies() de
 * next/headers fuerza a Next a tratar toda la ruta como dinámica y evita el
 * revalidate por tiempo. Estas lecturas no dependen de ninguna sesión de
 * usuario, así que un cliente sin estado deja que `export const revalidate`
 * en las páginas funcione como ISR real.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
