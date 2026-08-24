import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/auth";
import { TextField, SelectField, TextareaField } from "../components/FormField";
import { mensajeDeError } from "../lib/errores";
import { minutesBetween, todayISO, parseDecimal } from "../lib/format";
import type { Tables } from "../lib/types";

const ESTADOS_MAR = ["Calmo", "Marejadilla", "Marejada", "Fuerte marejada"];

export function NuevaInmersion() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { session, esBuzo, idBuzo } = useAuth();

  const [buzos, setBuzos] = useState<Tables<"buzo">[]>([]);
  const [supervisores, setSupervisores] = useState<Tables<"supervisor">[]>([]);
  const [clientes, setClientes] = useState<Tables<"cliente">[]>([]);
  const [equipos, setEquipos] = useState<Tables<"equipos">[]>([]);
  const [tablaNavy, setTablaNavy] = useState<Tables<"tabla_us_navy">[]>([]);
  const [centros, setCentros] = useState<Tables<"centro_cultivo">[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [form, setForm] = useState({
    fecha_inmersion: todayISO(),
    id_buzo: esBuzo ? idBuzo ?? "" : "",
    id_buzo_emergencia: "",
    id_supervisor: "",
    id_cliente: "",
    id_centro_cultivo: "",
    id_equipo: "",
    embarcacion: "",
    hora_dejo_superficie: "",
    hora_llego_fondo: "",
    hora_dejo_fondo: "",
    hora_llego_superficie: "",
    temperatura_agua: "",
    estado_mar: "",
    faena_realizada: "",
    profundidad_maxima: "",
    tiempo_total_descompresion: "",
    id_navy: "",
  });

  useEffect(() => {
    (async () => {
      const [b, s, c, e, n] = await Promise.all([
        supabase.from("buzo").select("*").eq("estado", "activo").order("nombre_buzo"),
        supabase.from("supervisor").select("*").order("nombre_super"),
        supabase.from("cliente").select("*").order("nombre_cliente"),
        supabase.from("equipos").select("*").order("matricula_equipo"),
        supabase.from("tabla_us_navy").select("*").order("composicion"),
      ]);
      setBuzos(b.data ?? []);
      setSupervisores(s.data ?? []);
      setClientes(c.data ?? []);
      setEquipos(e.data ?? []);
      setTablaNavy(n.data ?? []);

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
            id_buzo_emergencia: perfil.id_buzo_emergencia ?? "",
            id_supervisor: perfil.id_supervisor ?? "",
            id_cliente: perfil.id_cliente ?? "",
            id_centro_cultivo: perfil.id_centro_cultivo ?? "",
            id_equipo: perfil.id_equipo ?? "",
            embarcacion: perfil.embarcacion ?? "",
            hora_dejo_superficie: perfil.hora_dejo_superficie ?? "",
            hora_llego_fondo: perfil.hora_llego_fondo ?? "",
            hora_dejo_fondo: perfil.hora_dejo_fondo ?? "",
            hora_llego_superficie: perfil.hora_llego_superficie ?? "",
            temperatura_agua: perfil.temperatura_agua?.toString() ?? "",
            estado_mar: perfil.estado_mar ?? "",
            faena_realizada: perfil.faena_realizada ?? "",
            profundidad_maxima: tiempos?.profundidad_maxima?.toString() ?? "",
            tiempo_total_descompresion: tiempos?.tiempo_total_descompresion?.toString() ?? "",
            id_navy: perfil.id_navy ?? "",
          });
        }
      }
    })();
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Carga los centros de cultivo del cliente elegido.
  useEffect(() => {
    if (!form.id_cliente) {
      setCentros([]);
      return;
    }
    supabase
      .from("centro_cultivo")
      .select("*")
      .eq("id_cliente", form.id_cliente)
      .order("nombre_centro")
      .then(({ data }) => setCentros(data ?? []));
  }, [form.id_cliente]);

  const tiempoTotalFondo = minutesBetween(form.hora_llego_fondo, form.hora_dejo_fondo);
  const tiempoTotalBuceo = minutesBetween(form.hora_dejo_superficie, form.hora_llego_superficie);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.id_buzo) {
      setError(
        esBuzo
          ? "Tu cuenta todavía no está ligada a una ficha de buzo. Pide a un administrador que la asocie en Administración → Usuarios."
          : "Debes seleccionar el buzo que realizó la inmersión."
      );
      return;
    }
    if (!form.id_buzo_emergencia) {
      setError("Debes seleccionar el buzo de emergencia.");
      return;
    }
    if (form.id_buzo_emergencia === form.id_buzo) {
      setError("El buzo de emergencia no puede ser el mismo buzo.");
      return;
    }
    if (!form.id_supervisor) {
      setError("Debes seleccionar el supervisor.");
      return;
    }
    if (!form.id_cliente) {
      setError("Debes seleccionar un cliente para poder elegir su centro de costo.");
      return;
    }
    if (!form.id_centro_cultivo) {
      setError(
        centros.length === 0
          ? "El cliente seleccionado no tiene centros de cultivo cargados. Agrégalos en el mantenedor de Clientes."
          : "Debes seleccionar un centro de costo."
      );
      return;
    }
    if (!form.embarcacion.trim()) {
      setError("Debes indicar la embarcación.");
      return;
    }
    if (!form.id_equipo) {
      setError("Debes seleccionar el equipo utilizado.");
      return;
    }
    if (!form.profundidad_maxima.trim()) {
      setError("Debes indicar la profundidad máxima.");
      return;
    }
    if (!form.hora_dejo_superficie) {
      setError("Debes indicar la hora en que dejó la superficie.");
      return;
    }
    if (!form.hora_llego_fondo) {
      setError("Debes indicar la hora en que llegó al fondo.");
      return;
    }
    if (!form.hora_dejo_fondo) {
      setError("Debes indicar la hora en que dejó el fondo.");
      return;
    }
    if (!form.hora_llego_superficie) {
      setError("Debes indicar la hora en que llegó a superficie.");
      return;
    }
    if (!form.id_navy) {
      setError("Debes seleccionar la tabulación de la Tabla US Navy.");
      return;
    }
    if (!form.temperatura_agua.trim()) {
      setError("Debes indicar la temperatura del agua.");
      return;
    }
    if (!form.estado_mar) {
      setError("Debes seleccionar el estado del mar.");
      return;
    }
    if (!form.faena_realizada.trim()) {
      setError("Debes describir la faena realizada.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fecha_inmersion: form.fecha_inmersion,
        id_buzo: form.id_buzo,
        id_buzo_emergencia: form.id_buzo_emergencia || null,
        id_supervisor: form.id_supervisor || null,
        id_cliente: form.id_cliente || null,
        id_centro_cultivo: form.id_centro_cultivo,
        id_equipo: form.id_equipo || null,
        id_navy: form.id_navy || null,
        embarcacion: form.embarcacion,
        hora_dejo_superficie: form.hora_dejo_superficie || null,
        hora_llego_fondo: form.hora_llego_fondo || null,
        hora_dejo_fondo: form.hora_dejo_fondo || null,
        hora_llego_superficie: form.hora_llego_superficie || null,
        temperatura_agua: form.temperatura_agua ? parseDecimal(form.temperatura_agua) : null,
        estado_mar: form.estado_mar || null,
        faena_realizada: form.faena_realizada || null,
        created_by: session?.user.id ?? null,
      };

      let inmersionId = id;
      if (editing && id) {
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
        tiempo_total_fondo: tiempoTotalFondo,
        tiempo_total_descompresion: form.tiempo_total_descompresion
          ? Number(form.tiempo_total_descompresion)
          : null,
        tiempo_total_buceo: tiempoTotalBuceo,
        profundidad_maxima: form.profundidad_maxima ? parseDecimal(form.profundidad_maxima) : null,
      };
      const { error: tError } = await supabase.from("tiempos_totales").upsert(tiemposPayload);
      if (tError) throw tError;

      setOk(true);
      setTimeout(() => navigate(`/inmersiones/${inmersionId}`), 700);
    } catch (err) {
      setError(mensajeDeError(err, "guardar la inmersión"));
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
            disabled={esBuzo}
            value={form.id_buzo}
            onChange={(e) => update("id_buzo", e.target.value)}
            options={buzos.map((b) => ({ value: b.id_buzo, label: `${b.nombre_buzo} · ${b.rut_buzo}` }))}
          />
          <SelectField
            label="Buzo de emergencia"
            required
            value={form.id_buzo_emergencia}
            onChange={(e) => update("id_buzo_emergencia", e.target.value)}
            options={buzos
              .filter((b) => b.id_buzo !== form.id_buzo)
              .map((b) => ({ value: b.id_buzo, label: `${b.nombre_buzo} · ${b.rut_buzo}` }))}
          />
          <SelectField
            label="Supervisor"
            required
            value={form.id_supervisor}
            onChange={(e) => update("id_supervisor", e.target.value)}
            options={supervisores.map((s) => ({ value: s.id_supervisor, label: s.nombre_super }))}
          />
          <SelectField
            label="Cliente"
            required
            value={form.id_cliente}
            onChange={(e) => {
              update("id_cliente", e.target.value);
              update("id_centro_cultivo", "");
            }}
            options={clientes.map((c) => ({ value: c.id_cliente, label: c.nombre_cliente }))}
          />
          <SelectField
            label="Centro de costo"
            required
            disabled={!form.id_cliente}
            value={form.id_centro_cultivo}
            onChange={(e) => update("id_centro_cultivo", e.target.value)}
            placeholder={form.id_cliente ? "Selecciona..." : "Primero elige un cliente"}
            options={centros.map((c) => ({ value: c.id_centro_cultivo, label: c.nombre_centro }))}
          />
          <TextField
            label="Embarcación"
            required
            value={form.embarcacion}
            onChange={(e) => update("embarcacion", e.target.value)}
            placeholder="Ej: Lancha Puelche II"
          />
          <SelectField
            label="Equipo utilizado"
            required
            value={form.id_equipo}
            onChange={(e) => update("id_equipo", e.target.value)}
            options={equipos.map((eq) => ({ value: eq.id_equipo, label: eq.matricula_equipo ?? "Sin matrícula" }))}
          />
        </Section>

        <Section title="Perfil de la inmersión">
          <TextField
            label="Profundidad máxima (mts)"
            type="text"
            inputMode="decimal"
            required
            placeholder="Ej: 24,4 o 24.4"
            value={form.profundidad_maxima}
            onChange={(e) => update("profundidad_maxima", e.target.value)}
          />
          <TextField
            label="Dejó superficie (hora)"
            type="time"
            required
            value={form.hora_dejo_superficie}
            onChange={(e) => update("hora_dejo_superficie", e.target.value)}
          />
          <TextField
            label="Llegó fondo (hora)"
            type="time"
            required
            value={form.hora_llego_fondo}
            onChange={(e) => update("hora_llego_fondo", e.target.value)}
          />
          <TextField
            label="Dejó fondo (hora)"
            type="time"
            required
            value={form.hora_dejo_fondo}
            onChange={(e) => update("hora_dejo_fondo", e.target.value)}
          />
          <TextField
            label="Llegó superficie (hora)"
            type="time"
            required
            value={form.hora_llego_superficie}
            onChange={(e) => update("hora_llego_superficie", e.target.value)}
          />
        </Section>

        <Section title="Tiempos totales">
          <div>
            <p className="field-label">Tiempo total fondo (mins)</p>
            <p className="field-input flex items-center bg-navy-900/30 text-slate-400">
              {tiempoTotalFondo ?? "Se calcula desde las horas de fondo"}
            </p>
          </div>
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
          <div>
            <SelectField
              label="Tabulación Tabla US Navy"
              required
              value={form.id_navy}
              onChange={(e) => update("id_navy", e.target.value)}
              placeholder={
                tablaNavy.length === 0 ? "Sin composiciones cargadas" : "Selecciona..."
              }
              options={tablaNavy.map((n) => ({ value: n.id_navy, label: n.composicion }))}
            />
            {tablaNavy.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">
                No hay composiciones cargadas en el mantenedor de Tabla US Navy.
              </p>
            )}
          </div>
        </Section>

        <Section title="Condiciones">
          <TextField
            label="Temperatura del agua (°C)"
            type="text"
            inputMode="decimal"
            required
            placeholder="Ej: 12,5 o 12.5"
            value={form.temperatura_agua}
            onChange={(e) => update("temperatura_agua", e.target.value)}
          />
          <SelectField
            label="Estado del mar"
            required
            value={form.estado_mar}
            onChange={(e) => update("estado_mar", e.target.value)}
            options={ESTADOS_MAR.map((v) => ({ value: v, label: v }))}
          />
        </Section>

        <Section title="Faena realizada">
          <div className="sm:col-span-2">
            <TextareaField
              label="Faena realizada"
              rows={3}
              required
              value={form.faena_realizada}
              onChange={(e) => update("faena_realizada", e.target.value)}
            />
          </div>
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
