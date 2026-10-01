-- Articulo 37, punto 4: identidad y matricula vigente del supervisor y de los
-- buzos. El buzo ya tiene clase_matricula + fecha_vencimiento_matricula; el
-- supervisor solo tenia la fecha de vencimiento, sin decir de que clase de
-- matricula se trata. Columna nullable, puramente aditiva.

alter table public.supervisor
  add column clase_matricula text;
