/**
 * Traduce los errores que devuelve Supabase/Postgres a un mensaje que explique
 * al usuario por qué no se pudo guardar, en vez de mostrar el error técnico.
 */

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

/** Mensajes por nombre de constraint, que es lo más específico que entrega Postgres. */
const PORConstraint: Record<string, string> = {
  chk_horas_orden:
    "Las horas no están en orden: dejó superficie ≤ llegó fondo ≤ dejó fondo ≤ llegó superficie.",
  chk_buzo_emergencia_distinto:
    "El buzo de emergencia no puede ser el mismo buzo que realiza la inmersión.",
  perfil_inmersion_id_buzo_fkey: "El buzo seleccionado ya no existe en el mantenedor.",
  perfil_inmersion_id_buzo_emergencia_fkey:
    "El buzo de emergencia seleccionado ya no existe en el mantenedor.",
  perfil_inmersion_id_centro_cultivo_fkey:
    "El centro de costo seleccionado ya no existe en el mantenedor de clientes.",
  perfil_inmersion_id_cliente_fkey: "El cliente seleccionado ya no existe en el mantenedor.",
  perfil_inmersion_id_equipo_fkey: "El equipo seleccionado ya no existe en el mantenedor.",
  perfil_inmersion_id_supervisor_fkey: "El supervisor seleccionado ya no existe en el mantenedor.",
  perfil_inmersion_id_navy_fkey:
    "La tabulación seleccionada ya no existe en el mantenedor de Tabla US Navy.",
  perfil_inmersion_id_tipo_faena_fkey:
    "El tipo de faena seleccionado ya no existe en el mantenedor.",
  buzo_rut_buzo_key: "Ya existe un buzo registrado con ese RUT.",
  supervisor_rut_super_key: "Ya existe un supervisor registrado con ese RUT.",
  idx_buzo_email_unique: "Ya existe un buzo registrado con ese correo electrónico.",
  tiempos_totales_id_buzo_fkey: "El buzo de los tiempos totales no existe en el mantenedor.",
  tiempos_totales_profundidad_obligatoria:
    "Debes indicar la profundidad máxima como un número entre 0 y 60 metros. Ejemplo: 24,4",
  tiempos_totales_descompresion_obligatoria:
    "Debes indicar el tiempo de descompresión en minutos. Si no requirió descompresión, escribe 0.",
  tiempos_totales_tiempos_obligatorios:
    "Faltan los tiempos de fondo o de buceo. Revisa que las cuatro horas de la inmersión estén completas.",
};

/** Mensajes por columna, para not-null violations. */
const PORColumna: Record<string, string> = {
  fecha_inmersion: "Falta la fecha de la inmersión.",
  id_buzo: "Debes seleccionar el buzo que realizó la inmersión.",
  id_centro_cultivo: "Debes seleccionar el centro de costo.",
  embarcacion: "Debes indicar la embarcación.",
  matricula_equipo: "Debes indicar la matrícula del equipo.",
  composicion: "Debes indicar la composición.",
};

function extraerConstraint(err: SupabaseLikeError): string | null {
  const texto = `${err.message ?? ""} ${err.details ?? ""}`;
  for (const nombre of Object.keys(PORConstraint)) {
    if (texto.includes(nombre)) return nombre;
  }
  return null;
}

function extraerColumna(err: SupabaseLikeError): string | null {
  const match = /column "([^"]+)"/.exec(`${err.message ?? ""} ${err.details ?? ""}`);
  return match?.[1] ?? null;
}

export function mensajeDeError(error: unknown, accion = "guardar"): string {
  if (!error) return `No se pudo ${accion}.`;

  const err = error as SupabaseLikeError;
  const constraint = extraerConstraint(err);
  if (constraint && PORConstraint[constraint]) return PORConstraint[constraint];

  switch (err.code) {
    case "23505": {
      return "Ya existe un registro con esos datos (valor duplicado).";
    }
    case "23503": {
      return "Uno de los registros relacionados ya no existe o está en uso por otro registro.";
    }
    case "23514": {
      return "Los datos no cumplen una regla de validación de la bitácora. Revisa las horas y los valores numéricos.";
    }
    case "23502": {
      const col = extraerColumna(err);
      if (col && PORColumna[col]) return PORColumna[col];
      return col
        ? `Falta completar un campo obligatorio (${col}).`
        : "Falta completar un campo obligatorio.";
    }
    case "42501": {
      return "No tienes permisos para realizar esta acción con tu rol actual.";
    }
    case "22P02": {
      return "Hay un valor con formato inválido. Revisa los campos numéricos y las fechas.";
    }
    case "22003": {
      return "Un valor numérico está fuera del rango permitido.";
    }
    case "PGRST301":
    case "PGRST116": {
      return "Tu sesión expiró o no tienes acceso a este registro. Vuelve a iniciar sesión.";
    }
  }

  const message = err.message ?? "";

  if (message.includes("row-level security") || message.includes("violates row-level security")) {
    return "No tienes permisos para guardar esta inmersión con tu rol actual. Si eres buzo, solo puedes registrar y editar tus propias inmersiones mientras estén pendientes.";
  }
  if (message.includes("ya fue validada")) {
    return "La inmersión ya fue validada por un administrador y no puede modificarse.";
  }
  if (message.includes("No se puede validar")) {
    return "No se puede validar: a la inmersión le falta la profundidad máxima o el tiempo de descompresión. Pide que se complete antes de validarla.";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "No hay conexión con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.";
  }
  if (message.includes("JWT") || message.includes("session")) {
    return "Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.";
  }

  return message ? `No se pudo ${accion}: ${message}` : `No se pudo ${accion}.`;
}
