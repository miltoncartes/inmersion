import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { TextField, SelectField, TextareaField } from "../components/FormField";
import { minutesBetween, todayISO } from "../lib/format";
import type { Tables } from "../lib/types";

const ESTADOS_MAR = ["Calmo", "Marejadilla", "Marejada", "Fuerte marejada"];

export function NuevaInmersion() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuth();

  const [buzos, setBuzos] = useState<Tables<"buzo">[]>([]);
  const [supervisores, setSupervisores] = useState<Tables<"supervisor">[]>([]);
  const [clientes, setClientes] = useState<Tables<"cliente">[]>([]);
  const [equipos, setEquipos] = useState<Tables<"equipos">[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [form, setForm] = useState({
    fecha_inmersion: todayISO(),
    id_buzo: "",
    id_supervisor: "",
    id_cliente: "",
    numero_serie_ordenador: "",
    hora_dejo_superficie: "",
    hora_llego_fondo: "",
    hora_dejo_fondo: "",
    hora_llego_superficie: "",
    ubicacion: "",
    temperatura_agua: "",
    estado_mar: "",
    faena_realizada: "",
    profundidad_maxima: "",
    tiempo_total_fondo: "",
    tiempo_total_descompresion: "",
    tabulacion: "",
  });

  useEffect(() => {
    (async () => {
      const [b, s, c, e] = await Promise.all([
        supabase.from("buzo").select("*").eq("estado", "activo").order("nombre_buzo"),
        supabase.from("supervisor").select("*").order("nombre_super"),
        supabase.from("cliente").select("*").order("nombre_cliente"),
        supabase.from("equipos").select("*").order("numero_serie_ordenador"),
      ]);
      setBuzos(b.data ?? []);
      setSupervisores(s.data ?? []);
      setClientes(c.data ?? []);
      setEquipos(e.data ?? []);

      if (id) {
        const { data: perfil } = await supabase
          .from("perfil_inmersion")
          .select("*")
          .eq("id_inmersion", id)
          .maybeSingle();
        const { data: tiempos } = await supabase
          .from("tiempos_totales")
          .select("*")
          .eq("id_inmersion", id)
          .maybeSingle();
        if (perfil) {
          setForm({
            fecha_inmersion: perfil.fecha_inmersion,
            id_buzo: perfil.id_buzo,
            id_supervisor: perfil.id_supervisor ?? "",
            id_cliente: perfil.id_cliente ?? "",
            numero_serie_ordenador: perfil.numero_serie_ordenador ?? "",
            hora_dejo_superficie: perfil.hora_dejo_superficie ?? "",
            hora_llego_fondo: perfil.hora_llego_fondo ?? "",
            hora_dejo_fondo: perfil.hora_dejo_fondo ?? "",
            hora_llego_superficie: perfil.hora_llego_superficie ?? "",
            ubicacion: perfil.ubicacion ?? "",
            temperatura_agua: perfil.temperatura_agua?.toString() ?? "",
            estado_mar: perfil.estado_mar ?? "",
            faena_realizada: perfil.faena_realizada ?? "",
            profundidad_maxima: tiempos?.profundidad_maxima?.toString() ?? "",
            tiempo_total_fondo: tiempos?.tiempo_total_fondo?.toString() ?? "",
            tiempo_total_descompresion: tiempos?.tiempo_total_descompresion?.toString() ?? "",
            tabulacion: tiempos?.tabulacion ?? "",
          });
        }
      }
    })();
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-sugiere el tiempo de fondo cuando cambian las horas de fondo.
  useEffect(() => {
    const mins = minutesBetween(form.hora_llego_fondo, form.hora_dejo_fondo);
    if (mins !== null) update("tiempo_total_fondo", String(mins));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hora_llego_fondo, form.hora_dejo_fondo]);

  const tiempoTotalBuceo = minutesBetween(form.hora_dejo_superficie, form.hora_llego_superficie);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        fecha_inmersion: form.fecha_inmersion,
        id_buzo: form.id_buzo,
        id_supervisor: form.id_supervisor || null,
        id_cliente: form.id_cliente || null,
        numero_serie_ordenador: form.numero_serie_ordenador || null,
        hora_dejo_superficie: form.hora_dejo_superficie || null,
        hora_llego_fondo: form.hora_llego_fondo || null,
        hora_dejo_fondo: form.hora_dejo_fondo || null,
        hora_llego_superficie: form.hora_llego_superficie || null,
        ubicacion: form.ubicacion || null,
        temperatura_agua: form.temperatura_agua ? Number(form.temperatura_agua) : null,
        estado_mar: form.estado_mar || null,
        faena_realizada: form.faena_realizada || null,
        created_by: session?.user.id ?? null,
      };

      let inmersionId = id;
      if (editing) {
        const { error } = await supabase.from("perfil_inmersion").update(payload).eq("id_inmersion", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("perfil_inmersion").insert(payload).select("id_inmersion").single();
        if (error) throw error;
        inmersionId = data.id_inmersion;
      }

      const tiemposPayload = {
        id_inmersion: inmersionId!,
        id_buzo: form.id_buzo,
        tiempo_total_fondo: form.tiempo_total_fondo ? Number(form.tiempo_total_fondo) : null,
        tiempo_total_descompresion: form.tiempo_total_descompresion
          ? Number(form.tiempo_total_descompresion)
          : null,
        tiempo_total_buceo: tiempoTotalBuceo,
        profundidad_maxima: form.profundidad_maxima ? Number(form.profundidad_maxima) : null,
        tabulacion: form.tabulacion || null,
      };
      const { error: tError } = await supabase.from("tiempos_totales").upsert(tiemposPayload);
      if (tError) throw tError;

      setOk(true);
      setTimeout(() => navigate(`/inmersiones/${inmersionId}`), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la inmersión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <PlusIcon />
        <h1 className="text-xl font-semibold text-slate-50">
          {editing ? "Editar inmersión" : "Registrar inmersión"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Section title="Identificación">
          <TextField
            label="Fecha"
            type="date"
            required
            value={form.fecha_inmersion}
            onChange={(e) => update("fecha_inmersion", e.target.value)}
          />
          <SelectField
            label="Buzo"
            required
            value={form.id_buzo}
            onChange={(e) => update("id_buzo", e.target.value)}
            options={buzos.map((b) => ({ value: b.id_buzo, label: `${b.nombre_buzo} · ${b.rut_buzo}` }))}
          />
          <SelectField
            label="Supervisor"
            value={form.id_supervisor}
            onChange={(e) => update("id_supervisor", e.target.value)}
            options={supervisores.map((s) => ({ value: s.id_supervisor, label: s.nombre_super }))}
          />
          <SelectField
            label="Cliente"
            value={form.id_cliente}
            onChange={(e) => update("id_cliente", e.target.value)}
            options={clientes.map((c) => ({ value: c.id_cliente, label: c.nombre_cliente }))}
          />
          <TextField
            label="Ubicación"
            value={form.ubicacion}
            onChange={(e) => update("ubicacion", e.target.value)}
            placeholder="Ej: Muelle Puerto Varas"
          />
        </Section>

        <Section title="Perfil de la inmersión">
          <TextField
            label="Profundidad máxima (mts)"
            type="number"
            step="0.1"
            min={0}
            value={form.profundidad_maxima}
            onChange={(e) => update("profundidad_maxima", e.target.value)}
          />
          <TextField
            label="Dejó superficie (hora)"
            type="time"
            value={form.hora_dejo_superficie}
            onChange={(e) => update("hora_dejo_superficie", e.target.value)}
          />
          <TextField
            label="Llegó fondo (hora)"
            type="time"
            value={form.hora_llego_fondo}
            onChange={(e) => update("hora_llego_fondo", e.target.value)}
          />
          <TextField
            label="Dejó fondo (hora)"
            type="time"
            value={form.hora_dejo_fondo}
            onChange={(e) => update("hora_dejo_fondo", e.target.value)}
          />
          <TextField
            label="Llegó superficie (hora)"
            type="time"
            value={form.hora_llego_superficie}
            onChange={(e) => update("hora_llego_superficie", e.target.value)}
          />
        </Section>

        <Section title="Tiempos totales">
          <TextField
            label="Tiempo total fondo (mins)"
            type="number"
            min={0}
            value={form.tiempo_total_fondo}
            onChange={(e) => update("tiempo_total_fondo", e.target.value)}
          />
          <TextField
            label="Tiempo total descompresión (mins)"
            type="number"
            min={0}
            value={form.tiempo_total_descompresion}
            onChange={(e) => update("tiempo_total_descompresion", e.target.value)}
          />
          <div>
            <p className="field-label">Tiempo total buceo (mins)</p>
            <p className="field-input flex items-center bg-navy-900/30 text-slate-400">
              {tiempoTotalBuceo ?? "Se calcula desde las horas de superficie"}
            </p>
          </div>
        </Section>

        <Section title="Condiciones">
          <TextField
            label="Temperatura del agua (°C)"
            type="number"
            step="0.1"
            value={form.temperatura_agua}
            onChange={(e) => update("temperatura_agua", e.target.value)}
          />
          <SelectField
            label="Estado del mar"
            value={form.estado_mar}
            onChange={(e) => update("estado_mar", e.target.value)}
            options={ESTADOS_MAR.map((v) => ({ value: v, label: v }))}
          />
        </Section>

        <Section title="Equipo">
          <SelectField
            label="Equipo utilizado"
            value={form.numero_serie_ordenador}
            onChange={(e) => update("numero_serie_ordenador", e.target.value)}
            options={equipos.map((eq) => ({
              value: eq.numero_serie_ordenador,
              label: `${eq.numero_serie_ordenador} · ${eq.tipo_equipo_buceo}`,
            }))}
          />
        </Section>

        <Section title="Tabulación y faena realizada">
          <TextField
            label="Tabulación"
            value={form.tabulacion}
            onChange={(e) => update("tabulacion", e.target.value)}
            placeholder="Ej: Tabla US Navy"
          />
          <TextareaField
            label="Faena realizada"
            rows={3}
            value={form.faena_realizada}
            onChange={(e) => update("faena_realizada", e.target.value)}
          />
        </Section>

        {error && <p className="field-error">{error}</p>}
        {ok && <p className="text-sm text-emerald-400">Inmersión guardada correctamente.</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Guardando…" : editing ? "Guardar cambios" : "Registrar inmersión"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-5">
      <p className="eyebrow border-b border-navy-700/70 pb-3">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-coral-500">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
