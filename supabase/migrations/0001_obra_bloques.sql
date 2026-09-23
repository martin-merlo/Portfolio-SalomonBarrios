-- Parte 1 del constructor de bloques: tabla obra_bloques + RLS.
--
-- Convive TEMPORALMENTE con subtitulo_extendido / texto_extendido / obra_imagenes:
-- el front de /obra/[slug] sigue usando esos campos hasta la Parte 2, así que esta
-- migración NO borra nada viejo ni migra contenido. Sólo agrega la tabla nueva.
--
-- El proyecto no tiene runner de migraciones: pegá este SQL en el editor de SQL
-- de Supabase (o corré `supabase db push` si tenés la CLI apuntada al proyecto).

create table if not exists public.obra_bloques (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.obras (id) on delete cascade,
  tipo        text not null check (tipo in ('texto', 'imagen', 'video')),
  orden       int not null default 0,
  contenido   text,                                                    -- tipo = 'texto'
  imagen_url  text,                                                    -- tipo = 'imagen'
  tamano      text check (tamano in ('chica', 'mediana', 'banner')),  -- tipo = 'imagen'
  video_url   text,                                                    -- tipo = 'video'
  created_at  timestamptz not null default now()
);

create index if not exists obra_bloques_obra_id_orden_idx
  on public.obra_bloques (obra_id, orden);

alter table public.obra_bloques enable row level security;

-- Mismo criterio que el resto de las tablas del proyecto:
--   SELECT público (anon + authenticated); INSERT/UPDATE/DELETE sólo authenticated.

drop policy if exists "obra_bloques_select_public" on public.obra_bloques;
create policy "obra_bloques_select_public"
  on public.obra_bloques
  for select
  using (true);

drop policy if exists "obra_bloques_insert_authenticated" on public.obra_bloques;
create policy "obra_bloques_insert_authenticated"
  on public.obra_bloques
  for insert
  to authenticated
  with check (true);

drop policy if exists "obra_bloques_update_authenticated" on public.obra_bloques;
create policy "obra_bloques_update_authenticated"
  on public.obra_bloques
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "obra_bloques_delete_authenticated" on public.obra_bloques;
create policy "obra_bloques_delete_authenticated"
  on public.obra_bloques
  for delete
  to authenticated
  using (true);
