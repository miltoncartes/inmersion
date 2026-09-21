-- La tarjeta "Minutos de Buceo Mensual" del Resumen descargaba todas las
-- inmersiones del mes con su fila de tiempos y las sumaba en el navegador. Con
-- 73 registros no se nota; con una bitacora de anos, la pantalla de inicio
-- terminaria bajando miles de filas para mostrar un numero.
--
-- Esta funcion hace la suma en Postgres y devuelve un entero.
--
-- SECURITY INVOKER (el valor por defecto, explicito aqui para que se lea): las
-- politicas RLS se siguen aplicando al usuario que llama, asi que un buzo suma
-- solo lo que puede ver y un editor suma todo. No se usa SECURITY DEFINER
-- justamente para no saltarse RLS.
--
-- La fecha de inicio se recibe como parametro en vez de calcularla con
-- current_date: el servidor corre en UTC y el cliente en horario de Chile, y en
-- el cambio de mes ambos no coinciden. El navegador ya calcula su inicio de mes
-- para las otras tarjetas, asi que se reutiliza y todas quedan consistentes.

create or replace function public.minutos_buceo_mes(p_desde date)
returns integer
language sql
stable
security invoker
set search_path to 'public'
as $$
  select coalesce(sum(t.tiempo_total_buceo), 0)::int
  from public.perfil_inmersion p
  join public.tiempos_totales t on t.id_inmersion = p.id_inmersion
  where p.fecha_inmersion >= p_desde;
$$;

revoke all on function public.minutos_buceo_mes(date) from public;
grant execute on function public.minutos_buceo_mes(date) to authenticated;
-- Supabase concede execute a anon por privilegios por defecto del esquema, y el
-- revoke a PUBLIC no alcanza esa concesion explicita. Sin sesion la funcion
-- devuelve 0 igual (RLS no deja ver ninguna fila), pero no hay razon para que
-- anon pueda llamarla.
revoke execute on function public.minutos_buceo_mes(date) from anon;
