import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { DataTable, type Column } from "../components/DataTable";
import { EmptyState, AnchorIcon } from "../components/EmptyState";
import { Badge } from "../components/Badge";
import { formatDate } from "../lib/format";
import type { EstadoValidacion } from "../lib/types";

type Row = {
  id_inmersion: string;
  fecha_inmersion: string;
  estado_validacion: EstadoValidacion;
  buzo: { nombre_buzo: string } | null;
  cliente: { nombre_cliente: string } | null;
  tiempos: { profundidad_maxima: number | null; tiempo_total_buceo: number | null } | null;
};

const SELECT =
  "id_inmersion, fecha_inmersion, estado_validacion, buzo:buzo!perfil_inmersion_id_buzo_fkey(nombre_buzo), cliente:cliente!id_cliente(nombre_cliente), tiempos:tiempos_totales!id_inmersion(profundidad_maxima, tiempo_total_buceo)";

// Traer toda la tabla en cada carga deja de ser viable a medida que crece la
// bitácora, así que la vista normal (sin búsqueda) va paginada. Al buscar,
// se trae un lote más grande una sola vez (no en cada tecla) y se filtra en
// el navegador, para no perder la posibilidad de encontrar algo que no esté
// en la página actual.
const PAGE_SIZE = 30;
const SEARCH_LIMIT = 500;

function normalizar(data: any[] | null): Row[] {
  return (data ?? []).map((r: any) => ({
    ...r,
    tiempos: Array.isArray(r.tiempos) ? r.tiempos[0] ?? null : r.tiempos,
  }));
}

export function Inmersiones() {
  const { puedeRegistrarInmersion } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const buscando = q.trim().length > 0;

  // Navegación paginada, cuando no hay una búsqueda activa.
  useEffect(() => {
    if (buscando) return;
    (async () => {
      setLoading(true);
      const { data, count } = await supabase
        .from("perfil_inmersion")
        .select(SELECT, { count: "exact" })
        .order("fecha_inmersion", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      setRows(normalizar(data));
      setTotalCount(count ?? 0);
      setLoading(false);
    })();
  }, [page, buscando]);

  // Al empezar a buscar, trae un lote más grande una sola vez; escribir más
  // letras solo filtra en el navegador, sin volver a consultar la base.
  useEffect(() => {
    if (!buscando) return;
    (async () => {
      setLoading(true);
      const { data, count } = await supabase
        .from("perfil_inmersion")
        .select(SELECT, { count: "exact" })
        .order("fecha_inmersion", { ascending: false })
        .range(0, SEARCH_LIMIT - 1);
      setRows(normalizar(data));
      setTotalCount(count ?? 0);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscando]);

  const filtered = rows.filter((r) => {
    if (!buscando) return true;
    const s = q.toLowerCase();
    return (
      r.buzo?.nombre_buzo.toLowerCase().includes(s) ||
      r.cliente?.nombre_cliente?.toLowerCase().includes(s)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns: Column<Row>[] = [
    {
      header: "Estado",
      cell: (r) => <Badge tone={r.estado_validacion}>{r.estado_validacion === "validada" ? "Validada" : "Pendiente"}</Badge>,
    },
    { header: "Fecha", cell: (r) => formatDate(r.fecha_inmersion) },
    { header: "Buzo", cell: (r) => r.buzo?.nombre_buzo ?? "—" },
    { header: "Cliente", cell: (r) => r.cliente?.nombre_cliente ?? "—" },
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
        {puedeRegistrarInmersion && (
          <Link to="/inmersiones/nueva" className="btn-primary">
            + Nueva inmersión
          </Link>
        )}
      </div>

      {(rows.length > 0 || buscando) && (
        <input
          className="field-input mb-2 max-w-sm"
          placeholder="Buscar por buzo o cliente…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (!e.target.value.trim()) setPage(0);
          }}
        />
      )}
      {buscando && totalCount > SEARCH_LIMIT && (
        <p className="mb-4 text-xs text-slate-500">
          Buscando dentro de las {SEARCH_LIMIT} inmersiones más recientes de {totalCount} en total.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : rows.length === 0 && !buscando ? (
        <EmptyState
          icon={<AnchorIcon size={32} />}
          title="Tu bitácora está vacía"
          description="Registra tu primera inmersión para empezar a ver tus estadísticas y tu historial de buceo."
          action={
            puedeRegistrarInmersion ? (
              <Link to="/inmersiones/nueva" className="btn-primary mt-2">
                Registrar inmersión
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={filtered} keyFn={(r) => r.id_inmersion} />
          {!buscando && totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>
                Página {page + 1} de {totalPaginas} · {totalCount} inmersiones en total
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ← Anterior
                </button>
                <button
                  className="btn-secondary"
                  disabled={page + 1 >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
