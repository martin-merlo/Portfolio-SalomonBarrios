-- 0005 — Permiso para borrar archivos de la carpeta general/ del bucket media.
--
-- Lo necesita la foto de la bio: al reemplazarla o quitarla, el panel borra el
-- archivo viejo. Hasta ahora el panel nunca borró nada de Storage y las políticas
-- del bucket no están en este repo, así que no se puede asumir que el permiso
-- exista. Sin él la foto se guarda igual, pero el archivo viejo queda en el
-- bucket y el panel avisa que no se pudo borrar.
--
-- Borrar en Storage exige permiso de SELECT y de DELETE sobre storage.objects.
-- El DELETE queda limitado a general/: las carpetas obras/ y proceso/ no cambian.
-- Las claves nuevas de contenido_sitio no necesitan SQL: el panel las crea con
-- upsert la primera vez que se guarda.
-- Idempotente: se puede correr más de una vez.
--
-- Para ver las políticas que ya existen:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';

drop policy if exists "media_select_authenticated" on storage.objects;
create policy "media_select_authenticated"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "media_general_delete_authenticated" on storage.objects;
create policy "media_general_delete_authenticated"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'general');
