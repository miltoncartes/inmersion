-- Articulo 37, punto 13: registro actualizado de los buzos incorporados a
-- programas de vigilancia de la salud por el organismo administrador de la
-- Ley 16.744 (ACHS, Mutual de Seguridad, IST, etc).
--
-- Se modela igual que vencimiento_hipervarico, que ya existe en esta misma
-- tabla: una fecha de proximo examen, para poder reusar el mismo semaforo de
-- vencimiento (activo/por vencer/vencido) que ya tiene el mantenedor de
-- Buzos, en vez de inventar un estado nuevo. Ambas columnas nullable, no
-- exigen nada a los buzos existentes.

alter table public.buzo
  add column organismo_administrador_salud text,
  add column fecha_proximo_examen_salud date;
