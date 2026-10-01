-- Busqueda del listado de Inmersiones, resuelta en el servidor.
--
-- El problema que reemplaza: el cliente bajaba hasta 500 inmersiones con sus
-- tres tablas unidas y filtraba en el navegador. Con 113 filas ya no cabe
-- completo en ese limite, asi que la busqueda podia decir "no encontrado"
-- sobre inmersiones que si existen -- un problema de correccion, no solo de
-- rendimiento.
--
-- security_invoker = on es la pieza critica: sin ella, una vista corre con los
-- permisos de quien la creo (el dueno del esquema) y se salta RLS por
-- completo, dejando a un buzo ver inmersiones ajenas. Con la vista marcada
-- asi, Postgres vuelve a evaluar las politicas de perfil_inmersion con el rol
-- del usuario que hace la consulta -- exactamente la misma regla
-- (is_editor() OR id_buzo = mi_id_buzo()) que ya protege la tabla base.

create or replace view public.v_inmersiones_listado
with (security_invoker = on)
as
select
  p.id_inmersion,
  p.fecha_inmersion,
  p.estado_validacion,
  p.id_buzo,
  b.nombre_buzo,
  p.id_cliente,
  c.nombre_cliente,
  t.profundidad_maxima,
  t.tiempo_total_buceo
from public.perfil_inmersion p
left join public.buzo b on b.id_buzo = p.id_buzo
left join public.cliente c on c.id_cliente = p.id_cliente
left join public.tiempos_totales t on t.id_inmersion = p.id_inmersion;

-- Las vistas no heredan los grants de sus tablas base: hay que concederlo
-- explicitamente. No se otorga a anon -- la app exige sesion para todo.
grant select on public.v_inmersiones_listado to authenticated;
