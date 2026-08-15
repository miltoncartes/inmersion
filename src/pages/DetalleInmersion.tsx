import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/format";
import type { Tables } from "../lib/types";

type Detalle = Tables<"perfil_inmersion"> & {
  buzo: Tables<"buzo"> | null;
  supervisor: Tables<"supervisor"> | null;
  cliente: Tables<"cliente"> | null;
  equipo: Tables<"equipos"> | null;
  tiempos: Tables<"tiempos_totales"> | null;
};

export function DetalleInmersion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { esAdmin } = useAuth();
  const [data, setData] = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: row } = await supabase
        .from("perfil_inmersion")
        .select(
          "*, buzo:buzo!id_buzo(*), supervisor:supervisor!id_supervisor(*), cliente:cliente!id_cliente(*), equipo:equipos!numero_serie_ordenador(*), tiempos:tiempos_totales!id_inmersion(*)"
        )
        .eq("id_inmersion", id)
        .maybeSingle();
      setData(
        row
          ? ({ ...row, tiempos: Array.isArray(row.tiempos) ? row.tiempos[0] ?? null : row.tiempos } as Detalle)
          : null
      );
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm("¿Eliminar esta inmersión? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("perfil_inmersion").delete().eq("id_inmersion", id);
    setDeleting(false);
    if (!error) navigate("/inmersiones");
  }

  if (loading) return <p className="text-sm text-slate-400">Cargando…</p>;
  if (!data) return <p className="text-sm text-slate-400">No se encontró la inmersión.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Inmersión</p>
          <h1 className="text-xl font-semibold text-slate-50">{formatDate(data.fecha_inmersion)}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/inmersiones/${id}/editar`} className="btn-secondary">
            Editar
          </Link>
          {esAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="btn-secondary text-red-400 hover:border-red-400">
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <InfoCard title="Identificación">
          <Row label="Buzo" value={`${data.buzo?.nombre_buzo ?? "—"}${data.buzo ? ` · ${data.buzo.rut_buzo}` : ""}`} />
          <Row label="Supervisor" value={data.supervisor?.nombre_super ?? "—"} />
          <Row label="Cliente" value={data.cliente?.nombre_cliente ?? "—"} />
          <Row label="Ubicación" value={data.ubicacion ?? "—"} />
        </InfoCard>

        <InfoCard title="Perfil de la inmersión">
          <Row label="Profundidad máxima" value={data.tiempos?.profundidad_maxima != null ? `${data.tiempos.profundidad_maxima} m` : "—"} />
          <Row label="Dejó superficie" value={data.hora_dejo_superficie ?? "—"} />
          <Row label="Llegó fondo" value={data.hora_llego_fondo ?? "—"} />
          <Row label="Dejó fondo" value={data.hora_dejo_fondo ?? "—"} />
          <Row label="Llegó superficie" value={data.hora_llego_superficie ?? "—"} />
        </InfoCard>

        <InfoCard title="Tiempos totales">
          <Row label="Tiempo total fondo" value={data.tiempos?.tiempo_total_fondo != null ? `${data.tiempos.tiempo_total_fondo} min` : "—"} />
          <Row label="Tiempo total descompresión" value={data.tiempos?.tiempo_total_descompresion != null ? `${data.tiempos.tiempo_total_descompresion} min` : "—"} />
          <Row label="Tiempo total buceo" value={data.tiempos?.tiempo_total_buceo != null ? `${data.tiempos.tiempo_total_buceo} min` : "—"} />
          <Row label="Tabulación" value={data.tiempos?.tabulacion ?? "—"} />
        </InfoCard>

        <InfoCard title="Condiciones y equipo">
          <Row label="Temperatura del agua" value={data.temperatura_agua != null ? `${data.temperatura_agua} °C` : "—"} />
          <Row label="Estado del mar" value={data.estado_mar ?? "—"} />
          <Row label="Equipo utilizado" value={data.equipo ? `${data.equipo.numero_serie_ordenador} · ${data.equipo.tipo_equipo_buceo}` : "—"} />
        </InfoCard>

        {data.faena_realizada && (
          <InfoCard title="Faena realizada">
            <p className="text-sm text-slate-200">{data.faena_realizada}</p>
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow border-b border-navy-700/70 pb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-100">{value}</span>
    </div>
  );
}
