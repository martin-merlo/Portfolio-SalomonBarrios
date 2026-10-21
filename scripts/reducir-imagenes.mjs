/**
 * Baja a 1600px (lado más largo) las imágenes YA SUBIDAS al bucket "media" de
 * Supabase Storage, que antes se guardaban hasta 2500px. Parte de la
 * protección de las obras: lo que se publica se ve bien en pantalla pero no
 * sirve para imprimir ni revender. Las subidas nuevas ya salen a 1600px desde
 * el panel (SubidaImagen).
 *
 * POR DEFECTO NO CAMBIA NADA: sólo lista qué imágenes reduciría (simulacro).
 * Con --aplicar, primero guarda cada original en ./respaldo-imagenes/ (misma
 * ruta que en el bucket) y recién después lo reemplaza en Storage. La URL de
 * cada imagen no cambia, así que no hay que tocar nada en la base.
 *
 * Se autentica como el artista (como scripts/seed.mjs). Necesita en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   PANEL_EMAIL (el email con el que se entra al panel) y
 *   SEED_ARTIST_PASSWORD (su contraseña).
 *
 * Uso:
 *   node scripts/reducir-imagenes.mjs            (simulacro)
 *   node scripts/reducir-imagenes.mjs --aplicar  (reduce de verdad)
 *
 * Nota: Supabase puede seguir sirviendo la versión anterior desde su caché
 * (CDN) un rato; se actualiza sola.
 */
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const BUCKET = 'media';
const MAX_LADO = 1600;
const CARPETA_RESPALDO = path.resolve(process.cwd(), 'respaldo-imagenes');
const APLICAR = process.argv.includes('--aplicar');

function cargarEnvLocal() {
  let contenido;
  try {
    contenido = readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  } catch {
    return;
  }
  for (const linea of contenido.split(/\r?\n/)) {
    const m = linea.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, clave, valorCrudo] = m;
    if (!(clave in process.env)) process.env[clave] = valorCrudo.trim().replace(/^["']|["']$/g, '');
  }
}

/** Todas las rutas de archivos del bucket (recorre las carpetas). */
async function listarTodo(storage, prefijo = '') {
  const rutas = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await storage.list(prefijo, { limit: 1000, offset });
    if (error) throw new Error(`No se pudo listar "${prefijo || '/'}": ${error.message}`);
    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
      if (item.id === null) rutas.push(...(await listarTodo(storage, ruta))); // carpeta
      else rutas.push(ruta);
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return rutas;
}

const FORMATOS = {
  '.jpg': ['jpeg', 'image/jpeg'],
  '.jpeg': ['jpeg', 'image/jpeg'],
  '.png': ['png', 'image/png'],
  '.webp': ['webp', 'image/webp'],
};

async function main() {
  cargarEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.PANEL_EMAIL;
  const password = process.env.SEED_ARTIST_PASSWORD;
  if (!url || !anonKey || !email || !password) {
    console.error(
      'Faltan variables en .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, PANEL_EMAIL y SEED_ARTIST_PASSWORD.',
    );
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error(`No se pudo iniciar sesión: ${authError.message}`);
    process.exit(1);
  }
  const storage = supabase.storage.from(BUCKET);

  console.log(APLICAR ? 'Modo: APLICAR (con respaldo local).' : 'Modo: simulacro (no cambia nada). Usá --aplicar para reducir.');
  const rutas = await listarTodo(storage);
  console.log(`${rutas.length} archivos en el bucket "${BUCKET}".`);

  let reducidas = 0;
  let yaChicas = 0;
  let errores = 0;
  for (const ruta of rutas) {
    const formato = FORMATOS[path.extname(ruta).toLowerCase()];
    if (!formato) continue; // no es una imagen que sepamos reescribir
    try {
      const { data: blob, error } = await storage.download(ruta);
      if (error) throw new Error(error.message);
      const original = Buffer.from(await blob.arrayBuffer());
      const { width = 0, height = 0 } = await sharp(original).metadata();
      if (Math.max(width, height) <= MAX_LADO) {
        yaChicas++;
        continue;
      }
      const reducida = await sharp(original)
        .rotate() // respeta la orientación EXIF antes de reducir
        .resize({ width: MAX_LADO, height: MAX_LADO, fit: 'inside', withoutEnlargement: true })
        .toFormat(formato[0], formato[0] === 'png' ? {} : { quality: 85 })
        .toBuffer();
      const meta = await sharp(reducida).metadata();
      console.log(`${APLICAR ? 'Reduciendo' : 'Reduciría'} ${ruta}: ${width}×${height} → ${meta.width}×${meta.height}`);
      if (APLICAR) {
        const destino = path.join(CARPETA_RESPALDO, ruta);
        await mkdir(path.dirname(destino), { recursive: true });
        await writeFile(destino, original);
        const { error: upError } = await storage.upload(ruta, reducida, {
          upsert: true,
          contentType: formato[1],
          cacheControl: '3600',
        });
        if (upError) throw new Error(`no se pudo reemplazar: ${upError.message}`);
      }
      reducidas++;
    } catch (e) {
      errores++;
      console.error(`Error con ${ruta}: ${e.message}`);
    }
  }

  console.log(
    `\nListo. ${APLICAR ? 'Reducidas' : 'Para reducir'}: ${reducidas} · ya en ≤${MAX_LADO}px: ${yaChicas} · errores: ${errores}`,
  );
  if (APLICAR && reducidas) console.log(`Originales respaldados en ${CARPETA_RESPALDO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
