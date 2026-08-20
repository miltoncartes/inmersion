import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/format";
import { mensajeDeError } from "../lib/errores";
import { Badge } from "../components/Badge";
import { Logo } from "../components/Logo";
import type { Tables } from "../lib/types";

type Detalle = Tables<"perfil_inmersion"> & {
  buzo: Tables<"buzo"> | null;
  buzo_emergencia: Tables<"buzo"> | null;
  supervisor: Tables<"supervisor"> | null;
  cliente: Tables<"cliente"> | null;
  centro_cultivo: Tables<"centro_cultivo"> | null;
  equipo: Tables<"equipos"> | null;
  tabulacion: Tables<"tabla_us_navy"> | null;
  tiempos: Tables<"tiempos_totales"> | null;
};

export function DetalleInmersion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { esAdmin, esEditor } = useAuth();
  const [data, setData] = useState<Detalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [validando, setValidando] = useState(false);

  async function cargar() {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: row } = await supabase
      .from("perfil_inmersion")
      .select(
        "*, buzo:buzo!perfil_inmersion_id_buzo_fkey(*), buzo_emergencia:buzo!perfil_inmersion_id_buzo_emergencia_fkey(*), supervisor:supervisor!id_supervisor(*), cliente:cliente!id_cliente(*), centro_cultivo:centro_cultivo!id_centro_cultivo(*), equipo:equipos!id_equipo(*), tabulacion:tabla_us_navy!id_navy(*), tiempos:tiempos_totales!id_inmersion(*)"
      )
      .eq("id_inmersion", id)
      .maybeSingle();
    const detalle = row
      ? ({ ...row, tiempos: Array.isArray(row.tiempos) ? row.tiempos[0] ?? null : row.tiempos } as Detalle)
      : null;
    setData(detalle);
    setObservacion(detalle?.observacion_admin ?? "");
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm("¿Eliminar esta inmersión? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("perfil_inmersion").delete().eq("id_inmersion", id);
    setDeleting(false);
    if (!error) navigate("/inmersiones");
  }

  async function handleValidar() {
    if (!id) return;
    setValidando(true);
    const { error } = await supabase
      .from("perfil_inmersion")
      .update({
        estado_validacion: "validada",
        observacion_admin: observacion || null,
      })
      .eq("id_inmersion", id);
    setValidando(false);
    if (error) {
      alert(mensajeDeError(error, "validar la inmersión"));
      return;
    }
    await cargar();
  }

  async function handleGuardarObservacion() {
    if (!id) return;
    setValidando(true);
    const { error } = await supabase
      .from("perfil_inmersion")
      .update({ observacion_admin: observacion || null })
      .eq("id_inmersion", id);
    setValidando(false);
    if (error) alert(mensajeDeError(error, "guardar la observación"));
    else await cargar();
  }

  if (loading) return <p className="text-sm text-slate-400">Cargando…</p>;
  if (!data) return <p className="text-sm text-slate-400">No se encontró la inmersión.</p>;

  const pendiente = data.estado_validacion === "pendiente";

  return (
    <div className="mx-auto max-w-2xl">
      <div id="print-header" className="print-only mb-6 hidden text-center">
        <Logo size={56} className="mx-auto mb-3" />
        <h1 className="text-3xl font-bold">Inmersión</h1>
        <p className="mt-1 text-slate-500">{formatDate(data.fecha_inmersion)}</p>
      </div>

      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Inmersión</p>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-50">{formatDate(data.fecha_inmersion)}</h1>
            <Badge tone={data.estado_validacion}>{data.estado_validacion === "validada" ? "Validada" : "Pendiente"}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary">
            Imprimir / Guardar PDF
          </button>
          {(esEditor || pendiente) && (
            <Link to={`/inmersiones/${id}/editar`} className="btn-secondary">
              Editar
            </Link>
          )}
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
          <Row label="Buzo de emergencia" value={data.buzo_emergencia?.nombre_buzo ?? "—"} />
          <Row label="Supervisor" value={data.supervisor?.nombre_super ?? "—"} />
          <Row label="Cliente" value={data.cliente?.nombre_cliente ?? "—"} />
          <Row label="Centro de costo" value={data.centro_cultivo?.nombre_centro ?? "—"} />
          <Row label="Embarcación" value={data.embarcacion ?? "—"} />
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
          <Row label="Tabulación Tabla US Navy" value={data.tabulacion?.composicion ?? "—"} />
        </InfoCard>

        <InfoCard title="Condiciones y equipo">
          <Row label="Temperatura del agua" value={data.temperatura_agua != null ? `${data.temperatura_agua} °C` : "—"} />
          <Row label="Estado del mar" value={data.estado_mar ?? "—"} />
          <Row label="Equipo utilizado" value={data.equipo?.nombre_ordenador ?? "—"} />
        </InfoCard>

        {data.faena_realizada && (
          <InfoCard title="Faena realizada">
            <p className="text-sm text-slate-200">{data.faena_realizada}</p>
          </InfoCard>
        )}

        <InfoCard title="Validación">
          {esAdmin ? (
            <div className="space-y-3">
              <div>
                <label className="field-label">Observación</label>
                <textarea
                  className="field-input resize-y"
                  rows={3}
                  placeholder="Notas para el buzo si hay algo que corregir…"
                  value={observacion}
                  disabled={!pendiente}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
              {pendiente ? (
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={handleGuardarObservacion} disabled={validando}>
                    Guardar observación
                  </button>
                  <button className="btn-primary" onClick={handleValidar} disabled={validando}>
                    {validando ? "Guardando…" : "Validar"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Validada{data.validado_at ? ` el ${formatDate(data.validado_at.slice(0, 10))}` : ""}. Ya no se puede editar.
                </p>
              )}
            </div>
          ) : (
            <>
              <Row label="Estado" value={data.estado_validacion === "validada" ? "Validada" : "Pendiente de revisión"} />
              {data.observacion_admin && (
                <div className="mt-2 rounded-lg bg-navy-900/60 p-3 text-sm text-slate-200">{data.observacion_admin}</div>
              )}
            </>
          )}
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3 p-5 print:border-0 print:bg-transparent print:shadow-none">
      <p className="eyebrow border-b border-navy-700/70 pb-3 print:text-black">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-400 print:text-slate-600">{label}</span>
      <span className="text-right font-medium text-slate-100 print:text-black">{value}</span>
    </div>
  );
}
