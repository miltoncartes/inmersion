import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { DataTable, type Column } from "../components/DataTable";
import { EmptyState, AnchorIcon } from "../components/EmptyState";
import { formatDate } from "../lib/format";

type Row = {
  id_inmersion: string;
  fecha_inmersion: string;
  ubicacion: string | null;
  buzo: { nombre_buzo: string } | null;
  cliente: { nombre_cliente: string } | null;
  tiempos: { profundidad_maxima: number | null; tiempo_total_buceo: number | null } | null;
};

export function Inmersiones() {
  const { esEditor } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("perfil_inmersion")
        .select(
          "id_inmersion, fecha_inmersion, ubicacion, buzo:buzo!id_buzo(nombre_buzo), cliente:cliente!id_cliente(nombre_cliente), tiempos:tiempos_totales!id_inmersion(profundidad_maxima, tiempo_total_buceo)"
        )
        .order("fecha_inmersion", { ascending: false });
      setRows(
        (data ?? []).map((r: any) => ({
          ...r,
          tiempos: Array.isArray(r.tiempos) ? r.tiempos[0] ?? null : r.tiempos,
        }))
      );
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.buzo?.nombre_buzo.toLowerCase().includes(s) ||
      r.cliente?.nombre_cliente?.toLowerCase().includes(s) ||
      r.ubicacion?.toLowerCase().includes(s)
    );
  });

  const columns: Column<Row>[] = [
    { header: "Fecha", cell: (r) => formatDate(r.fecha_inmersion) },
    { header: "Buzo", cell: (r) => r.buzo?.nombre_buzo ?? "—" },
    { header: "Cliente", cell: (r) => r.cliente?.nombre_cliente ?? "—" },
    { header: "Ubicación", cell: (r) => r.ubicacion ?? "—" },
    { header: "Prof. máx.", cell: (r) => (r.tiempos?.profundidad_maxima != null ? `${r.tiempos.profundidad_maxima} m` : "—") },
    { header: "Buceo", cell: (r) => (r.tiempos?.tiempo_total_buceo != null ? `${r.tiempos.tiempo_total_buceo} min` : "—") },
    {
      header: "",
      cell: (r) => (
        <Link to={`/inmersiones/${r.id_inmersion}`} className="btn-ghost">
          Ver →
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-50">Inmersiones</h1>
        {esEditor && (
          <Link to="/inmersiones/nueva" className="btn-primary">
            + Nueva inmersión
          </Link>
        )}
      </div>

      {rows.length > 0 && (
        <input
          className="field-input mb-4 max-w-sm"
          placeholder="Buscar por buzo, cliente o ubicación…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<AnchorIcon size={32} />}
          title="Tu bitácora está vacía"
          description="Registra tu primera inmersión para empezar a ver tus estadísticas y tu historial de buceo."
          action={
            esEditor ? (
              <Link to="/inmersiones/nueva" className="btn-primary mt-2">
                Registrar inmersión
              </Link>
            ) : undefined
          }
        />
      ) : (
        <DataTable columns={columns} rows={filtered} keyFn={(r) => r.id_inmersion} />
      )}
    </div>
  );
}
