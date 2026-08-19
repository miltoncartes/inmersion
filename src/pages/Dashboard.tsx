import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { StatTile } from "../components/StatTile";
import { EmptyState, AnchorIcon } from "../components/EmptyState";
import { formatDate } from "../lib/format";

type Recent = {
  id_inmersion: string;
  fecha_inmersion: string;
  ubicacion: string | null;
  buzo: { nombre_buzo: string } | null;
};

export function Dashboard() {
  const { perfil, puedeRegistrarInmersion } = useAuth();
  const [totalMes, setTotalMes] = useState(0);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [buzosActivos, setBuzosActivos] = useState(0);
  const [vencimientos, setVencimientos] = useState(0);
  const [recientes, setRecientes] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const en30dias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const hoyISO = now.toISOString().slice(0, 10);

      const [mes, historico, buzos, vencBuzos, vencEquipos, recent] = await Promise.all([
        supabase.from("perfil_inmersion").select("id_inmersion", { count: "exact", head: true }).gte("fecha_inmersion", inicioMes),
        supabase.from("perfil_inmersion").select("id_inmersion", { count: "exact", head: true }),
        supabase.from("buzo").select("id_buzo", { count: "exact", head: true }).eq("estado", "activo"),
        supabase
          .from("buzo")
          .select("id_buzo", { count: "exact", head: true })
          .not("vencimiento_hipervarico", "is", null)
          .lte("vencimiento_hipervarico", en30dias)
          .gte("vencimiento_hipervarico", hoyISO),
        supabase
          .from("equipos")
          .select("id_equipo", { count: "exact", head: true })
          .not("vencimiento_equipo", "is", null)
          .lte("vencimiento_equipo", en30dias)
          .gte("vencimiento_equipo", hoyISO),
        supabase
          .from("perfil_inmersion")
          .select("id_inmersion, fecha_inmersion, ubicacion, buzo:buzo!id_buzo(nombre_buzo)")
          .order("fecha_inmersion", { ascending: false })
          .limit(5),
      ]);

      setTotalMes(mes.count ?? 0);
      setTotalHistorico(historico.count ?? 0);
      setBuzosActivos(buzos.count ?? 0);
      setVencimientos((vencBuzos.count ?? 0) + (vencEquipos.count ?? 0));
      setRecientes((recent.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Bienvenido</p>
        <h1 className="text-xl font-semibold text-slate-50">{perfil?.nombre ?? "—"}</h1>
      </div>

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
            <StatTile label="Vencimientos próx." value={vencimientos} hint="Próximos 30 días" />
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Últimas inmersiones</h2>
              <Link to="/inmersiones" className="btn-ghost">
                Ver todas →
              </Link>
            </div>
            <div className="card divide-y divide-navy-800/70">
              {recientes.map((r) => (
                <Link
                  key={r.id_inmersion}
                  to={`/inmersiones/${r.id_inmersion}`}
                  className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-navy-800/40"
                >
                  <span className="text-slate-200">{r.buzo?.nombre_buzo ?? "—"}</span>
                  <span className="text-slate-400">{r.ubicacion ?? "—"}</span>
                  <span className="text-slate-400">{formatDate(r.fecha_inmersion)}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
