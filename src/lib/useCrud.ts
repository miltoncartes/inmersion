import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { invalidarCatalogos } from "./catalogos";
import type { Database } from "./types";

type TableName = keyof Database["public"]["Tables"];

// Tablas que alimentan el caché de catálogos del formulario de inmersión: al
// modificarlas hay que descartar ese caché para que el cambio se vea de
// inmediato en "Nueva inmersión".
const TABLAS_DE_CATALOGO: string[] = ["buzo", "supervisor", "cliente", "equipos", "tabla_us_navy"];

export function useCrud<T extends TableName>(table: T, orderBy: string) {
  type Row = Database["public"]["Tables"][T]["Row"];
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = supabase.from(table).select("*") as any;
    const { data, error } = await query.order(orderBy);
    if (error) setError(error.message);
    setRows((data as Row[] | null) ?? []);
    setLoading(false);
  }, [table, orderBy]);

  function invalidarSiEsCatalogo() {
    if (TABLAS_DE_CATALOGO.includes(table as string)) invalidarCatalogos();
  }

  useEffect(() => {
    reload();
  }, [reload]);

  async function insert(payload: Database["public"]["Tables"][T]["Insert"]) {
    const { error } = await supabase.from(table).insert(payload as any);
    if (error) return error.message;
    invalidarSiEsCatalogo();
    await reload();
    return null;
  }

  async function update(match: Record<string, string>, payload: Database["public"]["Tables"][T]["Update"]) {
    let query: any = supabase.from(table).update(payload as any);
    for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
    const { error } = await query;
    if (error) return error.message;
    invalidarSiEsCatalogo();
    await reload();
    return null;
  }

  async function remove(match: Record<string, string>) {
    let query: any = supabase.from(table).delete();
    for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
    const { error } = await query;
    if (error) return error.message;
    invalidarSiEsCatalogo();
    await reload();
    return null;
  }

  return { rows, loading, error, reload, insert, update, remove };
}
