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
  nombre_buzo: string | null;
  nombre_cliente: string | null;
  profundidad_maxima: number | null;
  tiempo_total_buceo: number | null;
};

// La busqueda vive en la base, en v_inmersiones_listado (vista con
// security_invoker = on: RLS se evalua con los permisos de quien consulta,
// asi que un buzo solo ve sus propias inmersiones a traves de ella, igual que
// en la tabla). Antes esto traia hasta 500 filas al navegador y filtraba ahi,
// lo que daba resultados falsos ("no encontrado") apenas la bitacora superaba
// ese limite. Ahora el filtro corre en Postgres y no tiene techo.
const SELECT = "id_inmersion, fecha_inmersion, estado_validacion, nombre_buzo, nombre_cliente, profundidad_maxima, tiempo_total_buceo";

const PAGE_SIZE = 30;
// Debounce de la busqueda: escribir letra por letra no debe disparar una
// consulta por tecla.
const DEBOUNCE_MS = 350;

const RANGOS = [
  { id: "3m", label: "Últimos 3 meses", meses: 3 },
  { id: "12m", label: "Últimos 12 meses", meses: 12 },
  { id: "todo", label: "Todo el historial", meses: null as number | null },
];

function inicioDeRango(meses: number | null): string | null {
  if (meses === null) return null;
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().slice(0, 10);
}

/** Escapa el termino para usarlo dentro de un filtro .or() de PostgREST: las
 * comillas dobles cierran el valor antes de tiempo si no se escapan. */
function patronBusqueda(termino: string): string {
  const seguro = termino.trim().replace(/"/g, '\\"');
  return `%${seguro}%`;
}

export function Inmersiones() {
  const { puedeRegistrarInmersion } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [rango, setRango] = useState<(typeof RANGOS)[number]["id"]>("3m");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  // Se distingue "nunca hubo inmersiones" (pantalla de bienvenida) de "no hay
  // resultados para este filtro" (mensaje con opcion de limpiarlo).
  const [totalHistorico, setTotalHistorico] = useState<number | null>(null);

  const buscando = qDebounced.trim().length > 0;

  // Conteo total, una sola vez, para decidir si la bitácora está realmente
  // vacía o si solo el filtro actual no encontró nada.
  useEffect(() => {
    supabase
      .from("perfil_inmersion")
      .select("id_inmersion", { count: "exact", head: true })
      .then(({ count }) => setTotalHistorico(count ?? 0));
  }, []);

  // Debounce: solo se actualiza qDebounced 350ms después de la última tecla.
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  // Al cambiar de búsqueda o de rango, se vuelve a la página 1.
  useEffect(() => {
    setPage(0);
  }, [qDebounced, rango]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from("v_inmersiones_listado").select(SELECT, { count: "exact" });

      if (buscando) {
        // La búsqueda ignora el rango de fechas a propósito: si alguien
        // busca un nombre, no tiene por qué saber en qué ventana de tiempo
        // cayó esa inmersión.
        const patron = patronBusqueda(qDebounced);
        query = query.or(`nombre_buzo.ilike."${patron}",nombre_cliente.ilike."${patron}"`);
      } else {
        const desde = inicioDeRango(RANGOS.find((r) => r.id === rango)?.meses ?? 3);
        if (desde) query = query.gte("fecha_inmersion", desde);
      }

      const { data, count, error } = await query
        .order("fecha_inmersion", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (error) setError(error.message);
      setRows((data as Row[] | null) ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    })();
  }, [page, qDebounced, rango, buscando]);

  const totalPaginas = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns: Column<Row>[] = [
    {
      header: "Estado",
      cell: (r) => <Badge tone={r.estado_validacion}>{r.estado_validacion === "validada" ? "Validada" : "Pendiente"}</Badge>,
    },
    { header: "Fecha", cell: (r) => formatDate(r.fecha_inmersion) },
    { header: "Buzo", cell: (r) => r.nombre_buzo ?? "—" },
    { header: "Cliente", cell: (r) => r.nombre_cliente ?? "—" },
    { header: "Prof. máx.", cell: (r) => (r.profundidad_maxima != null ? `${r.profundidad_maxima} m` : "—") },
    { header: "Buceo", cell: (r) => (r.tiempo_total_buceo != null ? `${r.tiempo_total_buceo} min` : "—") },
    {
      header: "",
      cell: (r) => (
        <Link to={`/inmersiones/${r.id_inmersion}`} className="btn-ghost">
          Ver →
        </Link>
      ),
    },
  ];

  const bitacoraVacia = totalHistorico === 0;
  const sinResultados = !loading && !bitacoraVacia && rows.length === 0;

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

      {!bitacoraVacia && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="field-input max-w-sm"
            placeholder="Buscar por buzo o cliente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {!buscando && (
            <div className="flex gap-1">
              {RANGOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRango(r.id)}
                  className={rango === r.id ? "btn-secondary bg-navy-700" : "btn-ghost"}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="field-error mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : bitacoraVacia ? (
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
      ) : sinResultados ? (
        <p className="text-sm text-slate-400">
          {buscando ? `Sin resultados para "${qDebounced}".` : "No hay inmersiones en este rango de fechas."}{" "}
          <button
            className="text-coral-400 underline"
            onClick={() => {
              setQ("");
              setRango("3m");
            }}
          >
            Limpiar filtro
          </button>
        </p>
      ) : (
        <>
          <DataTable columns={columns} rows={rows} keyFn={(r) => r.id_inmersion} />
          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>
                Página {page + 1} de {totalPaginas} · {totalCount} inmersiones{buscando ? " encontradas" : " en este rango"}
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
