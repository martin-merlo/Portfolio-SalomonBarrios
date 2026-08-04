import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de Supabase para el navegador (Client Components). Usa las claves
 * públicas — seguras de exponer porque el acceso real lo controla RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
