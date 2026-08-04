import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase para Server Components / Route Handlers. Lee y
 * reescribe cookies de sesión a través del cookie store de Next; el catch en
 * setAll es el caso esperado al llamarse desde un Server Component puro (no
 * puede escribir cookies) — inofensivo mientras haya un middleware que
 * refresque la sesión, o mientras no dependamos de auth en el front público.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component — no puede escribir cookies.
          }
        },
      },
    },
  );
}
