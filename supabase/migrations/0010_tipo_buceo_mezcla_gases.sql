-- Articulo 37, punto 2: tipo de buceo y mezcla de gases empleada. La app no
-- modelaba esto en ninguna parte -- la Tabla US Navy (id_navy) es la pareja
-- profundidad/tiempo de la tabla de descompresion, no la mezcla de gases.
--
-- Se agrega como texto libre con opciones sugeridas en el cliente (mismo
-- patron que estado_mar: una lista fija en el frontend, sin catalogo en la
-- base), porque la operacion de MDI Buceo es mayoritariamente aire
-- comprimido y no se justifica una tabla aparte para un puñado de valores.
-- Ambas columnas son opcionales a proposito: con 113 inmersiones historicas
-- sin este dato, exigirlo de inmediato habria bloqueado la edicion de
-- cualquiera de ellas.

alter table public.perfil_inmersion
  add column tipo_buceo text,
  add column mezcla_gases text;
