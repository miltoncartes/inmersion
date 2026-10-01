-- Articulo 37 (Ministerio del Trabajo), punto 8: numero de serie e
-- informacion de mantenimiento del compresor de buceo profesional. Hoy la
-- app no modela el compresor en ninguna parte.
--
-- Se agrega como dos columnas mas en equipos, no como catalogo nuevo, porque
-- es exactamente el patron ya establecido en esta misma tabla para
-- consola_aire, consola_comunicaciones y cargador_alta_presion: pares
-- numero_serie + fecha_mantencion bolted onto el equipo, sin tabla ni RLS
-- propias. Puramente aditivo: columnas nullable, no exige nada a los equipos
-- existentes y hereda las politicas RLS que ya tiene la tabla.

alter table public.equipos
  add column numero_serie_compresor text,
  add column fecha_mantencion_compresor date;
