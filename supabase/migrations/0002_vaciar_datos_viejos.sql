-- OPCIONAL — limpieza de datos de prueba reemplazados por los bloques (Parte 2).
-- CORRÉ ESTO VOS, MANUALMENTE, en el SQL editor de Supabase. El código ya no lee
-- estos datos, así que dejarlos no rompe nada; esto es sólo para dejar limpio.
--
-- NO borra columnas ni tablas, y NO toca subtitulo_extendido (ese campo se queda).
-- Sólo vacía el contenido viejo: texto_extendido (valores) y la tabla obra_imagenes.

-- 1) Vaciar los valores de texto_extendido (la columna sigue existiendo, sin uso).
update public.obras
  set texto_extendido = null
  where texto_extendido is not null;

-- 2) Vaciar la galería vieja. Todo esto es data de prueba.
delete from public.obra_imagenes;

-- Si además querés eliminar del todo lo viejo de la base (no hace falta, y el
-- código no lo necesita), podrías correr lo de abajo — pero es DESTRUCTIVO e
-- irreversible, así que queda comentado a propósito. Decidilo vos:
--
--   alter table public.obras drop column texto_extendido;
--   drop table public.obra_imagenes;
