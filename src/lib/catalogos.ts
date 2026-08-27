import { supabase } from "./supabaseClient";
import type { Tables } from "./types";

/**
 * Caché en memoria para los catálogos que alimentan el formulario de
 * inmersión (buzos, supervisores, clientes, equipos y Tabla US Navy).
 *
 * Sin esto, cada vez que alguien abre "Nueva inmersión" se descargan las 5
 * tablas completas de nuevo — incluso si acaba de salir y volver a entrar, y
 * aunque esos datos no cambien en semanas. La Tabla US Navy sola ya tiene
 * decenas de filas y crece con cada carga masiva por CSV.
 *
 * El caché dura lo que dure la pestaña abierta, con un tiempo de expiración
 * corto para que un cambio hecho en un mantenedor se refleje sin obligar al
 * usuario a recargar la página. `invalidarCatalogos()` permite forzar la
 * recarga inmediata después de editar un mantenedor.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutos

export type Catalogos = {
  buzos: Tables<"buzo">[];
  supervisores: Tables<"supervisor">[];
  clientes: Tables<"cliente">[];
  equipos: Tables<"equipos">[];
  tablaNavy: Tables<"tabla_us_navy">[];
};

let cache: { datos: Catalogos; expiraEn: number } | null = null;
// Si dos componentes piden los catálogos a la vez, comparten la misma
// consulta en vez de disparar dos rondas idénticas contra la base.
let enVuelo: Promise<Catalogos> | null = null;

async function traerCatalogos(): Promise<Catalogos> {
  const [b, s, c, e, n] = await Promise.all([
    supabase.from("buzo").select("*").eq("estado", "activo").order("nombre_buzo"),
    supabase.from("supervisor").select("*").order("nombre_super"),
    supabase.from("cliente").select("*").order("nombre_cliente"),
    supabase.from("equipos").select("*").order("matricula_equipo"),
    supabase.from("tabla_us_navy").select("*").order("composicion"),
  ]);

  return {
    buzos: b.data ?? [],
    supervisores: s.data ?? [],
    clientes: c.data ?? [],
    equipos: e.data ?? [],
    tablaNavy: n.data ?? [],
  };
}

export async function getCatalogos(): Promise<Catalogos> {
  if (cache && Date.now() < cache.expiraEn) return cache.datos;
  if (enVuelo) return enVuelo;

  enVuelo = traerCatalogos()
    .then((datos) => {
      cache = { datos, expiraEn: Date.now() + TTL_MS };
      return datos;
    })
    .finally(() => {
      enVuelo = null;
    });

  return enVuelo;
}

/** Descarta el caché: la próxima lectura vuelve a consultar la base. */
export function invalidarCatalogos() {
  cache = null;
}
