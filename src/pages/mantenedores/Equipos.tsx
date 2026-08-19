import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supabase } from "../../lib/supabaseClient";
import { equipoSchema, type EquipoForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, SelectField } from "../../components/FormField";
import { Badge } from "../../components/Badge";
import type { Tables } from "../../lib/types";

const empty: EquipoForm = {
  nombre_ordenador: "",
  id_masc: "",
  id_botella_aux: "",
  id_botella_emer: "",
  numero_serie_consola_aire: "",
  fecha_calibracion_consola_aire: "",
  numero_serie_consola_comunicaciones: "",
  fecha_mantencion_consola_comunicaciones: "",
  numero_serie_cargador_alta_presion: "",
  fecha_mantencion_cargador_alta_presion: "",
  matricula_equipo: "",
  vencimiento_equipo: "",
};

function estadoVencimiento(fecha: string | null): "activo" | "por_vencer" | "vencido" | null {
  if (!fecha) return null;
  const hoy = new Date();
  const venc = new Date(fecha);
  const dias = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "por_vencer";
  return "activo";
}

export function Equipos() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("equipos", "nombre_ordenador");
  const [mascaras, setMascaras] = useState<Tables<"mascaras">[]>([]);
  const [botellasAux, setBotellasAux] = useState<Tables<"botellas_aux">[]>([]);
  const [botellasEmer, setBotellasEmer] = useState<Tables<"botellas_emer">[]>([]);
  const [modal, setModal] = useState<null | "nuevo" | Tables<"equipos">>(null);
  const [form, setForm] = useState<EquipoForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, ba, be] = await Promise.all([
        supabase.from("mascaras").select("*").order("nombre_masc"),
        supabase.from("botellas_aux").select("*").order("nombre_botella_aux"),
        supabase.from("botellas_emer").select("*").order("nombre_botella_emer"),
      ]);
      setMascaras(m.data ?? []);
      setBotellasAux(ba.data ?? []);
      setBotellasEmer(be.data ?? []);
    })();
  }, []);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"equipos">) {
    setForm({
      nombre_ordenador: row.nombre_ordenador,
      id_masc: row.id_masc ?? "",
      id_botella_aux: row.id_botella_aux ?? "",
      id_botella_emer: row.id_botella_emer ?? "",
      numero_serie_consola_aire: row.numero_serie_consola_aire ?? "",
      fecha_calibracion_consola_aire: row.fecha_calibracion_consola_aire ?? "",
      numero_serie_consola_comunicaciones: row.numero_serie_consola_comunicaciones ?? "",
      fecha_mantencion_consola_comunicaciones: row.fecha_mantencion_consola_comunicaciones ?? "",
      numero_serie_cargador_alta_presion: row.numero_serie_cargador_alta_presion ?? "",
      fecha_mantencion_cargador_alta_presion: row.fecha_mantencion_cargador_alta_presion ?? "",
      matricula_equipo: row.matricula_equipo ?? "",
      vencimiento_equipo: row.vencimiento_equipo ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = equipoSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const d = parsed.data;
    const payload = {
      nombre_ordenador: d.nombre_ordenador,
      id_masc: d.id_masc || null,
      id_botella_aux: d.id_botella_aux || null,
      id_botella_emer: d.id_botella_emer || null,
      numero_serie_consola_aire: d.numero_serie_consola_aire || null,
      fecha_calibracion_consola_aire: d.fecha_calibracion_consola_aire || null,
      numero_serie_consola_comunicaciones: d.numero_serie_consola_comunicaciones || null,
      fecha_mantencion_consola_comunicaciones: d.fecha_mantencion_consola_comunicaciones || null,
      numero_serie_cargador_alta_presion: d.numero_serie_cargador_alta_presion || null,
      fecha_mantencion_cargador_alta_presion: d.fecha_mantencion_cargador_alta_presion || null,
      matricula_equipo: d.matricula_equipo || null,
      vencimiento_equipo: d.vencimiento_equipo || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_equipo: (modal as Tables<"equipos">).id_equipo }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"equipos">) {
    if (!confirm(`¿Eliminar el equipo ${row.nombre_ordenador}?`)) return;
    const err = await remove({ id_equipo: row.id_equipo });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"equipos">>[] = [
    { header: "Ordenador", cell: (r) => r.nombre_ordenador },
    { header: "Matrícula", cell: (r) => r.matricula_equipo ?? "—" },
    { header: "Vencimiento", cell: (r) => formatDate(r.vencimiento_equipo) },
    {
      header: "Estado",
      cell: (r) => {
        const estado = estadoVencimiento(r.vencimiento_equipo);
        return estado ? <Badge tone={estado}>{estado.replace("_", " ")}</Badge> : <span className="text-slate-500">—</span>;
      },
    },
    {
      header: "",
      cell: (r) =>
        esEditor ? (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => openEditar(r)}>
              Editar
            </button>
            {esAdmin && (
              <button className="btn-ghost text-red-400" onClick={() => handleDelete(r)}>
                Eliminar
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Mantenedor</p>
          <h1 className="text-xl font-semibold text-slate-50">Equipos</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nuevo equipo
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFn={(r) => r.id_equipo}
          emptyMessage="Aún no hay equipos registrados."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo equipo" : "Editar equipo"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Nombre del ordenador"
              required
              value={form.nombre_ordenador}
              onChange={(e) => setForm({ ...form, nombre_ordenador: e.target.value })}
              placeholder="Ej: Ordenador Suunto 04"
              error={errors.nombre_ordenador}
            />
            <SelectField
              label="Máscara"
              value={form.id_masc ?? ""}
              onChange={(e) => setForm({ ...form, id_masc: e.target.value })}
              options={mascaras.map((m) => ({ value: m.id_masc, label: m.nombre_masc }))}
            />
            <SelectField
              label="Botella banco auxiliar"
              value={form.id_botella_aux ?? ""}
              onChange={(e) => setForm({ ...form, id_botella_aux: e.target.value })}
              options={botellasAux.map((b) => ({ value: b.id_botella_aux, label: b.nombre_botella_aux }))}
            />
            <SelectField
              label="Botella banco emergencia"
              value={form.id_botella_emer ?? ""}
              onChange={(e) => setForm({ ...form, id_botella_emer: e.target.value })}
              options={botellasEmer.map((b) => ({ value: b.id_botella_emer, label: b.nombre_botella_emer }))}
            />
            <TextField
              label="N° serie consola de aire"
              value={form.numero_serie_consola_aire ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_consola_aire: e.target.value })}
            />
            <TextField
              label="Fecha calibración consola de aire"
              type="date"
              value={form.fecha_calibracion_consola_aire ?? ""}
              onChange={(e) => setForm({ ...form, fecha_calibracion_consola_aire: e.target.value })}
            />
            <TextField
              label="N° serie consola de comunicaciones"
              value={form.numero_serie_consola_comunicaciones ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_consola_comunicaciones: e.target.value })}
            />
            <TextField
              label="Fecha mantención consola de comunicaciones"
              type="date"
              value={form.fecha_mantencion_consola_comunicaciones ?? ""}
              onChange={(e) => setForm({ ...form, fecha_mantencion_consola_comunicaciones: e.target.value })}
            />
            <TextField
              label="N° serie cargador de alta presión"
              value={form.numero_serie_cargador_alta_presion ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_cargador_alta_presion: e.target.value })}
            />
            <TextField
              label="Fecha mantención cargador de alta presión"
              type="date"
              value={form.fecha_mantencion_cargador_alta_presion ?? ""}
              onChange={(e) => setForm({ ...form, fecha_mantencion_cargador_alta_presion: e.target.value })}
            />
            <TextField
              label="Matrícula del equipo"
              value={form.matricula_equipo ?? ""}
              onChange={(e) => setForm({ ...form, matricula_equipo: e.target.value })}
            />
            <TextField
              label="Vencimiento del equipo"
              type="date"
              value={form.vencimiento_equipo ?? ""}
              onChange={(e) => setForm({ ...form, vencimiento_equipo: e.target.value })}
            />
            {errors._global && <p className="field-error">{errors._global}</p>}
            <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
