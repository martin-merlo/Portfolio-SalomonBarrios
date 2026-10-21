-- 0004 — Versión en inglés del contenido (toggle ES/EN del sitio público).
--
-- Cada texto que el artista escribe en el panel suma una columna *_en,
-- opcional. Si está vacía, el sitio muestra la versión en español (fallback),
-- así que esta migración no cambia nada visible hasta que se cargue el inglés.
-- Idempotente: se puede correr más de una vez.

-- Contenido general (hero, declaración, bio, CV). contenido_sitio es
-- clave/valor: el inglés va en una columna paralela a `valor`.
alter table public.contenido_sitio add column if not exists valor_en text;

-- Obras: título, técnica, descripción y subtítulo extendido.
alter table public.obras add column if not exists titulo_en text;
alter table public.obras add column if not exists tecnica_en text;
alter table public.obras add column if not exists descripcion_en text;
alter table public.obras add column if not exists subtitulo_extendido_en text;

-- Bloques de las páginas de obra: título y contenido (HTML del editor).
alter table public.obra_bloques add column if not exists titulo_en text;
alter table public.obra_bloques add column if not exists contenido_en text;

-- Carrusel de proceso: texto corto.
alter table public.proceso add column if not exists texto_corto_en text;
