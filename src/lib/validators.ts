import { z } from "zod";
import { isValidRut } from "./format";

const rutSchema = z
  .string()
  .min(3, "RUT requerido")
  .refine(isValidRut, "RUT inválido");

export const buzoSchema = z.object({
  rut_buzo: rutSchema,
  nombre_buzo: z.string().min(2, "Nombre requerido"),
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .or(z.literal(""))
    .optional()
    .nullable(),
  clase_matricula: z.string().optional().nullable(),
  fecha_vencimiento_matricula: z.string().optional().nullable(),
  vencimiento_hipervarico: z.string().optional().nullable(),
  estado: z.enum(["activo", "inactivo", "suspendido"]),
  habilitado: z.boolean(),
  ordenador_asignado: z.string().optional().nullable(),
});
export type BuzoForm = z.infer<typeof buzoSchema>;

export const tablaUsNavySchema = z.object({
  composicion: z.string().min(1, "Composición requerida"),
  observacion: z.string().optional().nullable(),
});
export type TablaUsNavyForm = z.infer<typeof tablaUsNavySchema>;

export const equipoSchema = z.object({
  matricula_equipo: z.string().min(1, "Matrícula del equipo requerida"),
  vencimiento_equipo: z.string().min(1, "Vencimiento del equipo requerido"),
  id_mascaras: z.array(z.string()).optional(),
  id_botellas_aux: z.array(z.string()).optional(),
  id_botellas_emer: z.array(z.string()).optional(),
  numero_serie_consola_aire: z.string().optional().nullable(),
  fecha_calibracion_consola_aire: z.string().optional().nullable(),
  numero_serie_consola_comunicaciones: z.string().optional().nullable(),
  fecha_mantencion_consola_comunicaciones: z.string().optional().nullable(),
  numero_serie_cargador_alta_presion: z.string().optional().nullable(),
  fecha_mantencion_cargador_alta_presion: z.string().optional().nullable(),
});
export type EquipoForm = z.infer<typeof equipoSchema>;

export const mascaraSchema = z.object({
  nombre_masc: z.string().min(1, "Nombre requerido"),
  fecha_mant_masc: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
});
export type MascaraForm = z.infer<typeof mascaraSchema>;

export const botellaAuxSchema = z.object({
  nombre_botella_aux: z.string().min(1, "Número de serie de botella requerido"),
  fecha_venc_aux: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
});
export type BotellaAuxForm = z.infer<typeof botellaAuxSchema>;

export const botellaEmerSchema = z.object({
  nombre_botella_emer: z.string().min(1, "Número de serie de botella requerido"),
  fecha_venc_emer: z.string().optional().nullable(),
  observacion: z.string().optional().nullable(),
});
export type BotellaEmerForm = z.infer<typeof botellaEmerSchema>;

export const supervisorSchema = z.object({
  rut_super: rutSchema,
  nombre_super: z.string().min(2, "Nombre requerido"),
  email: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .or(z.literal(""))
    .optional()
    .nullable(),
  fecha_vencimiento_matricula: z.string().optional().nullable(),
  habilitado: z.boolean(),
});
export type SupervisorForm = z.infer<typeof supervisorSchema>;

export const clienteSchema = z.object({
  nombre_cliente: z.string().min(2, "Nombre requerido"),
  observacion: z.string().optional().nullable(),
});
export type ClienteForm = z.infer<typeof clienteSchema>;

export const centroCultivoSchema = z.object({
  nombre_centro: z.string().min(1, "Nombre requerido"),
});
export type CentroCultivoForm = z.infer<typeof centroCultivoSchema>;

export const inmersionSchema = z
  .object({
    fecha_inmersion: z.string().min(1, "Fecha requerida"),
    id_buzo: z.string().min(1, "Buzo requerido"),
    id_buzo_emergencia: z.string().min(1, "Buzo de emergencia requerido"),
    id_supervisor: z.string().min(1, "Supervisor requerido"),
    id_cliente: z.string().min(1, "Cliente requerido"),
    id_centro_cultivo: z.string().min(1, "Centro de costo requerido"),
    id_equipo: z.string().min(1, "Equipo requerido"),
    embarcacion: z.string().min(1, "Embarcación requerida"),
    hora_dejo_superficie: z.string().min(1, "Hora requerida"),
    hora_llego_fondo: z.string().min(1, "Hora requerida"),
    hora_dejo_fondo: z.string().min(1, "Hora requerida"),
    hora_llego_superficie: z.string().min(1, "Hora requerida"),
    temperatura_agua: z.union([z.number(), z.nan()]),
    estado_mar: z.string().min(1, "Estado del mar requerido"),
    faena_realizada: z.string().min(1, "Faena realizada requerida"),
    profundidad_maxima: z.union([z.number(), z.nan()]),
    tiempo_total_fondo: z.union([z.number(), z.nan()]).optional().nullable(),
    tiempo_total_descompresion: z.union([z.number(), z.nan()]).optional().nullable(),
    id_navy: z.string().min(1, "Tabulación US Navy requerida"),
  })
  .refine((v) => v.id_buzo_emergencia !== v.id_buzo, {
    message: "El buzo de emergencia no puede ser el mismo buzo",
    path: ["id_buzo_emergencia"],
  });
export type InmersionForm = z.infer<typeof inmersionSchema>;
