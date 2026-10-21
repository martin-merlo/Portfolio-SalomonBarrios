import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizarContenido } from '@/lib/textoRico';

/**
 * Traducción automática ES → EN para el panel (botón "Traducir del español"
 * de cada campo bilingüe). Usa DeepL: la clave va en la variable de entorno
 * DEEPL_API_KEY (en .env.local y en el hosting). Las claves del plan gratis
 * terminan en ":fx" y usan otro endpoint.
 *
 * - Sólo para el artista logueado: se verifica la sesión de Supabase (las
 *   rutas /api no pasan por el middleware del panel), así nadie de afuera
 *   puede gastar la cuota de traducción.
 * - `html: true` para los textos del editor enriquecido: DeepL traduce el
 *   texto respetando las etiquetas (negrita, listas, links). El resultado se
 *   vuelve a sanitizar al mostrarse en el sitio, como todo el HTML.
 * - El artista revisa y corrige la traducción antes de guardar.
 */

const MAX_CARACTERES = 30000;
const IDIOMA_DESTINO = 'EN-US';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const clave = process.env.DEEPL_API_KEY;
  if (!clave) {
    return NextResponse.json(
      { error: 'La traducción automática no está configurada (falta DEEPL_API_KEY). Podés escribir el inglés a mano.' },
      { status: 503 },
    );
  }

  let cuerpo: { texto?: unknown; html?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }
  const html = cuerpo.html === true;
  const original = typeof cuerpo.texto === 'string' ? cuerpo.texto : '';
  // Texto plano viejo de los campos enriquecidos → párrafos HTML antes de traducir.
  const texto = html ? normalizarContenido(original) : original.trim();
  if (!texto) return NextResponse.json({ traduccion: '' });
  if (texto.length > MAX_CARACTERES) {
    return NextResponse.json({ error: 'El texto es demasiado largo para traducirlo de una vez.' }, { status: 413 });
  }

  const endpoint = clave.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `DeepL-Auth-Key ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: [texto],
        source_lang: 'ES',
        target_lang: IDIOMA_DESTINO,
        ...(html ? { tag_handling: 'html' } : { preserve_formatting: true }),
      }),
    });
    if (!r.ok) {
      const motivo = r.status === 456 ? 'Se agotó la cuota mensual de traducción.' : `El servicio de traducción respondió ${r.status}.`;
      return NextResponse.json({ error: motivo }, { status: 502 });
    }
    const datos = (await r.json()) as { translations?: { text: string }[] };
    return NextResponse.json({ traduccion: datos.translations?.[0]?.text ?? '' });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con el servicio de traducción.' }, { status: 502 });
  }
}
