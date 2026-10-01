-- Catalogo de tipos de faena. faena_realizada sigue siendo texto libre para el
-- detalle (ej. "limpieza de redes sector norte, 4 jaulas"), pero sin una
-- categoria estructurada ningun reporte puede agrupar por tipo de trabajo. Con
-- 113 inmersiones el cambio es barato; con miles sera caro, por eso se hace
-- ahora aunque el modulo de reportes todavia no exista.
--
-- Es puramente aditivo: la columna nueva en perfil_inmersion es nullable, asi
-- que no hace falta NOT VALID ni tocar ninguna de las 113 filas existentes.
-- Mismo patron de RLS y trigger que el resto de los catalogos (Tabla US Navy,
-- Mascaras, etc.): select para cualquier usuario activo, insert/update para
-- admin o supervisor, delete solo para admin.

create table public.tipos_faena (
  id_tipo_faena uuid primary key default gen_random_uuid(),
  nombre text not null,
  observacion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita duplicados como "Limpieza de redes" y "limpieza de redes" conviviendo.
create unique index idx_tipos_faena_nombre_unico on public.tipos_faena (lower(nombre));

alter table public.tipos_faena enable row level security;

create policy tipos_faena_select on public.tipos_faena
  for select using (public.is_active_user());

create policy tipos_faena_insert on public.tipos_faena
  for insert with check (public.is_editor());

create policy tipos_faena_update on public.tipos_faena
  for update using (public.is_editor()) with check (public.is_editor());

create policy tipos_faena_delete on public.tipos_faena
  for delete using (public.is_admin());

create trigger trg_tipos_faena_updated_at
  before update on public.tipos_faena
  for each row execute function public.set_updated_at();

-- FK nullable y ON DELETE RESTRICT: no se puede borrar un tipo de faena que ya
-- esta en uso en alguna inmersion (mismo criterio que id_buzo, id_cliente, etc).
alter table public.perfil_inmersion
  add column id_tipo_faena uuid references public.tipos_faena(id_tipo_faena) on delete restrict;

create index idx_perfil_inmersion_tipo_faena on public.perfil_inmersion (id_tipo_faena);
