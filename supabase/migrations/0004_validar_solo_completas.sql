-- Una inmersion no se puede dar por validada si le faltan datos. El caso real:
-- el 9 de septiembre se valido una inmersion sin profundidad maxima y nada lo
-- advirtio; al quedar validada, solo un admin puede corregirla.
--
-- La regla va en el trigger y no en el boton, asi que aplica aunque alguien
-- llame la API directamente. Se mantiene SECURITY INVOKER (no se declara
-- SECURITY DEFINER) y el search_path fijo, de modo que las politicas RLS siguen
-- rigiendo igual para cada rol.
--
-- Respecto de 0002 hay dos cambios mas:
--   1. El rol se lee una sola vez al entrar, en vez de consultar usuarios_app
--      hasta cuatro veces por fila actualizada.
--   2. La verificacion pregunta "existe una fila completa?" en vez de "existe
--      una fila incompleta?". La forma negada dejaba pasar el caso de que no
--      existiera fila de tiempos, que es el mas incompleto de todos.

create or replace function public.protect_validacion_fields()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_editor boolean := public.is_editor();
  v_admin  boolean := public.is_admin();
begin
  -- Buzos y lectura no pueden tocar los campos de validacion: se revierten en
  -- silencio. Al correr primero, un no-editor nunca alcanza el chequeo de abajo.
  if not v_editor then
    new.estado_validacion := old.estado_validacion;
    new.observacion_admin := old.observacion_admin;
    new.validado_por := old.validado_por;
    new.validado_at := old.validado_at;
  end if;

  -- Una inmersion ya validada queda cerrada para todos menos el admin.
  if old.estado_validacion = 'validada' and not v_admin then
    raise exception 'La inmersión ya fue validada y no puede modificarse.';
  end if;

  if new.estado_validacion = 'validada' and old.estado_validacion <> 'validada' then
    -- Solo se valida lo que esta completo.
    if not exists (
      select 1
      from public.tiempos_totales t
      where t.id_inmersion = new.id_inmersion
        and t.profundidad_maxima is not null
        and t.tiempo_total_descompresion is not null
    ) then
      raise exception 'No se puede validar: la inmersión no tiene profundidad máxima o tiempo de descompresión registrados.';
    end if;

    -- Sello de auditoria en el momento en que pasa a validada.
    new.validado_por := (select auth.uid());
    new.validado_at := now();
  end if;

  return new;
end;
$function$;
