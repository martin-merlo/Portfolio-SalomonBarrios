-- Parte 3 — ajustes a obra_bloques:
--   1) renombra el tamaño de imagen 'mediana' → 'normal' (mismo vocabulario que
--      la grilla del home: chica / normal / banner),
--   2) agrega `titulo` (título opcional de los bloques de texto),
--   3) agrega `video_ancho` (% del ancho de la columna que ocupa el video).
--
-- ⚠️ CORRÉ ESTO VOS, MANUALMENTE, en el SQL editor de Supabase ANTES de probar
-- el panel o el front. Si no, los bloques van a fallar (columnas/valores que el
-- código espera y todavía no existen), igual que pasó con la tabla la primera
-- vez.
--
-- Ojo con el ORDEN del check: hay que SACAR el check viejo ANTES de hacer el
-- UPDATE a 'normal'. Si se actualizara con el check viejo todavía puesto
-- ('chica','mediana','banner'), el valor 'normal' lo violaría y el UPDATE
-- fallaría. Por eso va: drop check → update datos → add check nuevo.

-- 1) Sacar el/los check viejo(s) de tamano (antes de migrar los datos). Robusto:
--    borra cualquier check que mencione `tamano`, sin depender del nombre exacto
--    que le haya puesto Postgres al crearlo inline en 0001.
do $$
declare nombre text;
begin
  for nombre in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'obra_bloques'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%tamano%'
  loop
    execute format('alter table public.obra_bloques drop constraint %I', nombre);
  end loop;
end $$;

-- 2) Migrar los valores existentes 'mediana' → 'normal'.
update public.obra_bloques set tamano = 'normal' where tamano = 'mediana';

-- 3) Poner el check nuevo: ('chica','normal','banner').
alter table public.obra_bloques
  add constraint obra_bloques_tamano_check
  check (tamano in ('chica', 'normal', 'banner'));

-- 4) Título opcional de los bloques de texto (encabezado arriba del contenido).
alter table public.obra_bloques add column if not exists titulo text;

-- 5) Ancho del video en % de la columna de contenido (25 / 50 / 75 / 100). Los
--    videos ya existentes quedan en 100 (ancho completo — desde el panel se
--    pueden achicar). El resto de los bloques, null.
alter table public.obra_bloques add column if not exists video_ancho int;
update public.obra_bloques
  set video_ancho = 100
  where tipo = 'video' and video_ancho is null;

alter table public.obra_bloques drop constraint if exists obra_bloques_video_ancho_check;
alter table public.obra_bloques
  add constraint obra_bloques_video_ancho_check
  check (video_ancho is null or video_ancho in (25, 50, 75, 100));
