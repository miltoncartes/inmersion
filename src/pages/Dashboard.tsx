import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { StatTile } from "../components/StatTile";
import { EmptyState, AnchorIcon } from "../components/EmptyState";
import { mensajeDeError } from "../lib/errores";
import { formatDate } from "../lib/format";

type Recent = {
  id_inmersion: string;
  fecha_inmersion: string;
  buzo: { nombre_buzo: string } | null;
  cliente: { nombre_cliente: string } | null;
  tiempos: { profundidad_maxima: number | null } | { profundidad_maxima: number | null }[] | null;
};

function profundidadDe(r: Recent): number | null {
  const t = Array.isArray(r.tiempos) ? r.tiempos[0] : r.tiempos;
  return t?.profundidad_maxima ?? null;
}

export function Dashboard() {
  const { perfil, esEditor, puedeRegistrarInmersion } = useAuth();
  const navigate = useNavigate();
  const [totalMes, setTotalMes] = useState(0);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [buzosActivos, setBuzosActivos] = useState(0);
  const [minutosMes, setMinutosMes] = useState(0);
  const [recientes, setRecientes] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      // Solo supervisores y administradores ven el detalle de las últimas
      // inmersiones (nombre del buzo, cliente, ubicación y profundidad); un
      // buzo no necesita ese resumen y así evitamos la consulta de más.
      const [mes, historico, buzos, buceoMes, recent] = await Promise.all([
        supabase.from("perfil_inmersion").select("id_inmersion", { count: "exact", head: true }).gte("fecha_inmersion", inicioMes),
        supabase.from("perfil_inmersion").select("id_inmersion", { count: "exact", head: true }),
        supabase.from("buzo").select("id_buzo", { count: "exact", head: true }).eq("estado", "activo"),
        supabase
          .from("perfil_inmersion")
          .select("tiempos:tiempos_totales!id_inmersion(tiempo_total_buceo)")
          .gte("fecha_inmersion", inicioMes),
        esEditor
          ? supabase
              .from("perfil_inmersion")
              .select(
                "id_inmersion, fecha_inmersion, buzo:buzo!perfil_inmersion_id_buzo_fkey(nombre_buzo), cliente:cliente!id_cliente(nombre_cliente), tiempos:tiempos_totales!id_inmersion(profundidad_maxima)"
              )
              .order("fecha_inmersion", { ascending: false })
              .limit(5)
          : Promise.resolve({ data: [], error: null, count: null }),
      ]);

      // Si alguna consulta falla hay que decirlo: mostrar "bitácora vacía"
      // cuando en realidad hubo un error oculta el problema real.
      const fallo = [mes, historico, buzos, buceoMes, recent].find((r) => r.error);
      setError(fallo?.error ? mensajeDeError(fallo.error, "cargar el resumen") : null);

      setTotalMes(mes.count ?? 0);
      setTotalHistorico(historico.count ?? 0);
      setBuzosActivos(buzos.count ?? 0);
      // Minutos buceados en el mes: es la suma de todos los buzos, no la del
      // usuario en sesion, porque el SELECT de tiempos_totales alcanza a todas
      // las inmersiones para cualquier usuario activo.
      setMinutosMes(
        ((buceoMes.data as any[]) ?? []).reduce((acc, fila) => {
          const t = Array.isArray(fila.tiempos) ? fila.tiempos[0] : fila.tiempos;
          return acc + (t?.tiempo_total_buceo ?? 0);
        }, 0)
      );
      setRecientes((recent.data as any) ?? []);
      setLoading(false);
    })();
  }, [esEditor]);

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Bienvenido</p>
        <h1 className="text-xl font-semibold text-slate-50">{perfil?.nombre ?? "—"}</h1>
      </div>

      {error && (
        <div className="card mb-4 border-red-500/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : totalHistorico === 0 ? (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Inmersiones del mes" value={totalMes} />
            <StatTile label="Total histórico" value={totalHistorico} />
            <StatTile label="Buzos activos" value={buzosActivos} />
            <StatTile
              label="Minutos de Buceo Mensual"
              value={minutosMes.toLocaleString("es-CL")}
              hint="Mes en curso · todos los buzos"
            />
          </div>

          {esEditor && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Últimas inmersiones</h2>
                <Link to="/inmersiones" className="btn-ghost">
                  Ver todas →
                </Link>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-navy-700/70">
                      <th className="eyebrow px-4 py-3 text-left font-medium">Nombre buzo</th>
                      <th className="eyebrow px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="eyebrow px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="eyebrow px-4 py-3 text-right font-medium">Prof. máx.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recientes.map((r) => {
                      const prof = profundidadDe(r);
                      return (
                        <tr
                          key={r.id_inmersion}
                          className="cursor-pointer border-b border-navy-800/70 last:border-0 hover:bg-navy-800/40"
                          onClick={() => navigate(`/inmersiones/${r.id_inmersion}`)}
                        >
                          <td className="px-4 py-3 text-slate-200">{r.buzo?.nombre_buzo ?? "—"}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(r.fecha_inmersion)}</td>
                          <td className="px-4 py-3 text-slate-400">{r.cliente?.nombre_cliente ?? "—"}</td>
                          <td className="px-4 py-3 text-right text-slate-200">{prof != null ? `${prof} m` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {recientes.length > 0 && (
                <div className="card mt-5 p-5">
                  <p className="text-sm font-semibold text-slate-200">Profundidad máxima por inmersión</p>
                  <p className="mb-3 text-xs text-slate-500">Últimas {recientes.length} inmersiones — metros por buzo</p>
                  <GraficoProfundidad
                    datos={recientes.map((r) => ({
                      etiqueta: r.buzo?.nombre_buzo ?? "—",
                      valor: profundidadDe(r) ?? 0,
                    }))}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GraficoProfundidad({ datos }: { datos: { etiqueta: string; valor: number }[] }) {
  const ancho = 700;
  const alto = 220;
  const margenIzq = 44;
  const margenDer = 20;
  const baseY = 188;
  const topeY = 20;
  const maxValor = Math.max(...datos.map((d) => d.valor), 1);
  const escalaMax = Math.ceil((maxValor * 1.15) / 5) * 5 || 5;
  const anchoUtil = ancho - margenIzq - margenDer;
  const pasoX = anchoUtil / datos.length;
  const anchoBarra = Math.min(60, pasoX * 0.55);
  const radio = 4;

  function y(valor: number) {
    return baseY - (valor / escalaMax) * (baseY - topeY);
  }

  function barraPath(x: number, yTop: number, w: number, h: number, r: number) {
    if (h <= 0) return "";
    const rr = Math.min(r, h, w / 2);
    return `M ${x} ${yTop + rr}
      a ${rr} ${rr} 0 0 1 ${rr} -${rr}
      h ${w - 2 * rr}
      a ${rr} ${rr} 0 0 1 ${rr} ${rr}
      v ${h - rr}
      h -${w}
      z`;
  }

  const niveles = [0, 0.33, 0.66, 1].map((f) => Math.round(escalaMax * f));

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} width="100%" style={{ overflow: "visible" }}>
      {niveles.map((nivel) => (
        <line
          key={nivel}
          x1={margenIzq}
          y1={y(nivel)}
          x2={ancho - margenDer}
          y2={y(nivel)}
          stroke={nivel === 0 ? "#2a4451" : "#1c2f3a"}
          strokeWidth={nivel === 0 ? 1.5 : 1}
        />
      ))}
      {niveles.map((nivel) => (
        <text
          key={`label-${nivel}`}
          x={margenIzq - 10}
          y={y(nivel) + 4}
          textAnchor="end"
          fontSize="10"
          fill="#64748b"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        >
          {nivel}m
        </text>
      ))}

      {datos.map((d, i) => {
        const cx = margenIzq + pasoX * i + pasoX / 2;
        const x = cx - anchoBarra / 2;
        const yTop = y(d.valor);
        const h = baseY - yTop;
        return (
          <g key={i}>
            <path d={barraPath(x, yTop, anchoBarra, h, radio)} fill="#e8794f" />
            {d.valor > 0 && (
              <text x={cx} y={yTop - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#f1f5f9">
                {d.valor} m
              </text>
            )}
            <text x={cx} y={baseY + 20} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {d.etiqueta.length > 16 ? `${d.etiqueta.slice(0, 15)}…` : d.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
