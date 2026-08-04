/**
 * Script de siembra de una sola vez: sube un puñado de obras reales del
 * artista a Supabase Storage (bucket "media", carpeta "obras/") e inserta
 * la fila correspondiente en la tabla `obras`.
 *
 * Se autentica como el artista (auth.signInWithPassword) en vez de usar la
 * service key — la password sale de la variable de entorno
 * SEED_ARTIST_PASSWORD en .env.local (agregala vos, no la inventamos acá).
 *
 * Uso:
 *   node scripts/seed.mjs
 * o:
 *   npm run seed
 */
import { readFile, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const ARTIST_EMAIL = 'salomonbp12@gmail.com';
const MAX_LADO_LARGO = 2500;
const BUCKET = 'media';

// Carpeta con arte real del artista (ver prompt de la fase). Si no es
// accesible desde donde corra este script, avisamos y salimos sin romper
// nada — este paso es un nice-to-have.
const CARPETA_IMAGENES = 'C:\\Users\\marti\\Downloads\\portfolio digital Folder\\Links';

// Selección curada a mano de entre 8 y 12 piezas de obra real: se excluyen
// del listado completo de la carpeta los íconos de redes (1946552.png,
// 5949057.png), la firma (firma.png) y los assets de textura/borde de papel
// (bordesitobnw.png, Artboard 1-1.jpg) — ninguno de esos es una obra.
const ARCHIVOS_OBRA = [
  '26 - 05, Vaca azul.jpg',
  'AngelSBP bknk.jpg',
  'arbol dibujo 4.jpg',
  'bebesolrealllll.png',
  'bichocasasSBPbknk.jpg',
  'condorrr.png',
  'moth.png',
  'samel.jpg',
  'Collab_salmonrndrfn2.jpg',
  'DSC01492.JPG',
  'sketch medley.jpg',
];

const TAMANOS_GRILLA = ['normal', 'banner', 'chica'];

function cargarEnvLocal() {
  const rutaEnv = path.resolve(process.cwd(), '.env.local');
  let contenido;
  try {
    contenido = readFileSync(rutaEnv, 'utf8');
  } catch {
    return;
  }
  for (const linea of contenido.split(/\r?\n/)) {
    const m = linea.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, clave, valorCrudo] = m;
    const valor = valorCrudo.trim().replace(/^["']|["']$/g, '');
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/**
 * Título genérico derivado del nombre de archivo. Si el nombre no alcanza
 * un mínimo de "descriptivo" (muy corto, sin letras, mayoría dígitos tipo
 * DSC01492, o un único token pegado demasiado largo) devuelve null para que
 * el llamador use "Obra N".
 */
function tituloDesdeArchivo(nombreArchivo) {
  const base = nombreArchivo.replace(/\.[^.]+$/, '');
  const limpio = base
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!limpio) return null;

  const letras = (limpio.match(/\p{L}/gu) ?? []).length;
  const digitos = (limpio.match(/\p{N}/gu) ?? []).length;
  const sinEspacios = limpio.replace(/\s+/g, '');
  const tokenUnicoDemasiadoLargo = !limpio.includes(' ') && sinEspacios.length > 14;

  const esDescriptivo = letras >= 3 && digitos <= letras && !tokenUnicoDemasiadoLargo;
  if (!esDescriptivo) return null;

  return limpio
    .split(' ')
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
}

async function main() {
  cargarEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const password = process.env.SEED_ARTIST_PASSWORD;

  if (!url || !anonKey) {
    console.error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.',
    );
    process.exit(1);
  }
  if (!password) {
    console.error(
      'Falta SEED_ARTIST_PASSWORD en .env.local (la contraseña de ' +
        ARTIST_EMAIL +
        '). Agregala y volvé a correr el script.',
    );
    process.exit(1);
  }

  let entradasCarpeta;
  try {
    entradasCarpeta = await readdir(CARPETA_IMAGENES);
  } catch {
    console.error(
      `No se pudo leer la carpeta de imágenes (${CARPETA_IMAGENES}) desde este entorno. ` +
        'Este paso es opcional — seguí sin seed si hace falta.',
    );
    process.exit(1);
  }

  const archivosDisponibles = ARCHIVOS_OBRA.filter((nombre) => entradasCarpeta.includes(nombre));
  if (archivosDisponibles.length === 0) {
    console.error('Ninguno de los archivos de obra esperados está en la carpeta. Abortando.');
    process.exit(1);
  }
  if (archivosDisponibles.length < ARCHIVOS_OBRA.length) {
    const faltantes = ARCHIVOS_OBRA.filter((n) => !archivosDisponibles.includes(n));
    console.warn('Archivos no encontrados, se saltean:', faltantes.join(', '));
  }

  const supabase = createClient(url, anonKey);

  console.log(`Autenticando como ${ARTIST_EMAIL}...`);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: ARTIST_EMAIL,
    password,
  });
  if (authError) {
    console.error('No se pudo autenticar contra Supabase:', authError.message);
    process.exit(1);
  }
  console.log('Autenticado correctamente.');

  const slugsUsados = new Set();
  let indiceOrden = 0;

  for (const nombreArchivo of archivosDisponibles) {
    indiceOrden += 1;
    const numeroObra = indiceOrden;

    try {
      const tituloGenerico = tituloDesdeArchivo(nombreArchivo);
      const titulo = tituloGenerico ?? `Obra ${numeroObra}`;

      let slug = slugify(titulo) || `obra-${numeroObra}`;
      while (slugsUsados.has(slug)) {
        slug = `${slug}-${numeroObra}`;
      }
      slugsUsados.add(slug);

      const { data: existente } = await supabase
        .from('obras')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existente) {
        console.log(`— "${titulo}" (${slug}) ya existe, se saltea.`);
        continue;
      }

      const rutaOrigen = path.join(CARPETA_IMAGENES, nombreArchivo);
      console.log(`Procesando "${nombreArchivo}" → "${titulo}"...`);

      const bufferOriginal = await readFile(rutaOrigen);
      const bufferComprimido = await sharp(bufferOriginal)
        .rotate() // respeta orientación EXIF antes de redimensionar
        .resize({
          width: MAX_LADO_LARGO,
          height: MAX_LADO_LARGO,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82 })
        .toBuffer();

      const rutaStorage = `obras/${slug}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(rutaStorage, bufferComprimido, {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (uploadError) {
        console.error(`  Error subiendo imagen de "${titulo}":`, uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(rutaStorage);

      const { error: insertError } = await supabase.from('obras').insert({
        titulo,
        tecnica: null,
        anio: null,
        dimensiones: 'Formato digital',
        descripcion: 'Obra de Salomón Barrios. Descripción pendiente de actualizar.',
        imagen_url: publicUrl,
        tiene_hover: false,
        imagen_hover_url: null,
        tamano_grilla: TAMANOS_GRILLA[(numeroObra - 1) % TAMANOS_GRILLA.length],
        orden: numeroObra,
        slug,
        tiene_pagina_propia: true,
        publicada: true,
        subtitulo_extendido: null,
        texto_extendido: null,
      });
      if (insertError) {
        console.error(`  Error insertando fila de "${titulo}":`, insertError.message);
        continue;
      }

      console.log(`  OK — /obra/${slug}`);
    } catch (err) {
      console.error(`  Error inesperado con "${nombreArchivo}":`, err.message);
    }
  }

  console.log('Listo.');
}

main();
