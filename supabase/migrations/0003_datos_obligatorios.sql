-- Cierra el hueco por el que una inmersion podia guardarse sin profundidad
-- maxima o sin tiempo de descompresion. El formulario ya no lo permite, pero el
-- control de verdad tiene que vivir en el servidor: la validacion del navegador
-- se puede saltar llamando la API directamente.
--
-- Profundidad y descompresion se agregan como NOT VALID a proposito: hay 1 fila
-- sin profundidad y 10 sin descompresion, y la instruccion del cliente fue no
-- tocar los registros ya cargados. NOT VALID rige para toda insercion y toda
-- modificacion desde ahora, sin revisar ni bloquear las filas existentes, y es
-- instantanea porque no recorre la tabla.
--
-- Cuando esas 11 filas esten corregidas, confirmar con:
--   alter table public.tiempos_totales validate constraint tiempos_totales_profundidad_obligatoria;
--   alter table public.tiempos_totales validate constraint tiempos_totales_descompresion_obligatoria;

alter table public.tiempos_totales
  add constraint tiempos_totales_profundidad_obligatoria
  check (
    profundidad_maxima is not null
    and profundidad_maxima > 0
    -- Techo operacional definido por MDI Buceo. La maxima registrada es 32,9 m;
    -- el tope atrapa errores de tipeo como 244 en vez de 24,4.
    and profundidad_maxima <= 60
  )
  not valid;

alter table public.tiempos_totales
  add constraint tiempos_totales_descompresion_obligatoria
  check (tiempo_total_descompresion is not null and tiempo_total_descompresion >= 0)
  not valid;

-- Fondo y buceo no tienen ni un solo null en las 73 filas actuales, asi que esta
-- si se agrega validada de inmediato: no deja deuda pendiente y el recorrido de
-- verificacion es instantaneo mientras la tabla es chica.
alter table public.tiempos_totales
  add constraint tiempos_totales_tiempos_obligatorios
  check (tiempo_total_fondo is not null and tiempo_total_buceo is not null);
