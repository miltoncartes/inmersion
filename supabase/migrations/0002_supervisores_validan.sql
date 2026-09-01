-- Los supervisores tambien pueden validar inmersiones y escribir la observacion.
-- Antes solo el rol admin podia tocar los campos de validacion.
-- Ademas se deja constancia automatica de quien valido y cuando: con mas de una
-- persona validando, "validada" sin autor no sirve como trazabilidad.

create or replace function public.protect_validacion_fields()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  -- Buzos y lectura no pueden tocar los campos de validacion: se revierten en silencio.
  if not public.is_editor() then
    new.estado_validacion := old.estado_validacion;
    new.observacion_admin := old.observacion_admin;
    new.validado_por := old.validado_por;
    new.validado_at := old.validado_at;
  end if;

  -- Una inmersion ya validada queda cerrada para todos menos el admin.
  if old.estado_validacion = 'validada' and not public.is_admin() then
    raise exception 'La inmersión ya fue validada y no puede modificarse.';
  end if;

  -- Sello de auditoria en el momento en que pasa a validada.
  if new.estado_validacion = 'validada' and old.estado_validacion <> 'validada' then
    new.validado_por := (select auth.uid());
    new.validado_at := now();
  end if;

  return new;
end;
$function$;
