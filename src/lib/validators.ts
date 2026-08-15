import { z } from "zod";
import { isValidRut } from "./format";

const rutSchema = z
  .string()
  .min(3, "RUT requerido")
  .refine(isValidRut, "RUT inválido");

export const buzoSchema = z.object({
  rut_buzo: rutSchema,
  nombre_buzo: z.string().min(2, "Nombre requerido"),
  clase_matricula: z.string().optional().nullable(),
  vencimiento_hipervarico: z.string().optional().nullable(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
});
export type BuzoForm = z.infer<typeof buzoSchema>;

export const equipoSchema = z.object({
  numero_serie_ordenador: z.string().min(1, "Número de serie requerido"),
  tipo_equipo_buceo: z.string().min(1, "Tipo de equipo requerido"),
  matricula_equipo: z.string().optional().nullable(),
  vencimiento_equipo: z.string().optional().nullable(),
});
export type EquipoForm = z.infer<typeof equipoSchema>;

export const supervisorSchema = z.object({
  rut_super: rutSchema,
  nombre_super: z.string().min(2, "Nombre requerido"),
});
export type SupervisorForm = z.infer<typeof supervisorSchema>;

export const clienteSchema = z.object({
  nombre_cliente: z.string().min(2, "Nombre requerido"),
  observacion: z.string().optional().nullable(),
});
export type ClienteForm = z.infer<typeof clienteSchema>;

export const inmersionSchema = z.object({
  fecha_inmersion: z.string().min(1, "Fecha requerida"),
  id_buzo: z.string().min(1, "Buzo requerido"),
  id_supervisor: z.string().optional().nullable(),
  id_cliente: z.string().optional().nullable(),
  numero_serie_ordenador: z.string().optional().nullable(),
  hora_dejo_superficie: z.string().optional().nullable(),
  hora_llego_fondo: z.string().optional().nullable(),
  hora_dejo_fondo: z.string().optional().nullable(),
  hora_llego_superficie: z.string().optional().nullable(),
  ubicacion: z.string().optional().nullable(),
  temperatura_agua: z.union([z.number(), z.nan()]).optional().nullable(),
  estado_mar: z.string().optional().nullable(),
  faena_realizada: z.string().optional().nullable(),
  profundidad_maxima: z.union([z.number(), z.nan()]).optional().nullable(),
  tiempo_total_fondo: z.union([z.number(), z.nan()]).optional().nullable(),
  tiempo_total_descompresion: z.union([z.number(), z.nan()]).optional().nullable(),
  tabulacion: z.string().optional().nullable(),
});
export type InmersionForm = z.infer<typeof inmersionSchema>;
