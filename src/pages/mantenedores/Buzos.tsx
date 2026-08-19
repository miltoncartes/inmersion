import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supabase } from "../../lib/supabaseClient";
import { buzoSchema, type BuzoForm } from "../../lib/validators";
import { mensajeDeError } from "../../lib/errores";
import { formatRut, formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, SelectField } from "../../components/FormField";
import { Badge } from "../../components/Badge";
import type { Tables } from "../../lib/types";

const ESTADOS = ["activo", "inactivo", "suspendido"];
const empty: BuzoForm = {
  rut_buzo: "",
  nombre_buzo: "",
  email: "",
  clase_matricula: "",
  vencimiento_hipervarico: "",
  estado: "activo",
  // Todo buzo nuevo nace deshabilitado: un admin o supervisor debe habilitarlo
  // para que pueda crear su cuenta e ingresar al sistema.
  habilitado: false,
  id_equipo_asignado: "",
};

export function Buzos() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("buzo", "nombre_buzo");
  const [equipos, setEquipos] = useState<Tables<"equipos">[]>([]);

  useEffect(() => {
    supabase
      .from("equipos")
      .select("*")
      .order("nombre_ordenador")
      .then(({ data }) => setEquipos(data ?? []));
  }, []);
  const [modal, setModal] = useState<null | "nuevo" | Tables<"buzo">>(null);
  const [form, setForm] = useState<BuzoForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"buzo">) {
    setForm({
      rut_buzo: row.rut_buzo,
      nombre_buzo: row.nombre_buzo,
      email: row.email ?? "",
      clase_matricula: row.clase_matricula ?? "",
      vencimiento_hipervarico: row.vencimiento_hipervarico ?? "",
      estado: row.estado as BuzoForm["estado"],
      habilitado: row.habilitado,
      id_equipo_asignado: row.id_equipo_asignado ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = buzoSchema.safeParse({ ...form, rut_buzo: formatRut(form.rut_buzo) });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      email: parsed.data.email?.trim() ? parsed.data.email.trim().toLowerCase() : null,
      clase_matricula: parsed.data.clase_matricula || null,
      vencimiento_hipervarico: parsed.data.vencimiento_hipervarico || null,
      id_equipo_asignado: parsed.data.id_equipo_asignado || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_buzo: (modal as Tables<"buzo">).id_buzo }, payload);
    setSaving(false);
    if (err) setErrors({ _global: mensajeDeError({ message: err }) });
    else setModal(null);
  }

  async function toggleHabilitado(row: Tables<"buzo">) {
    if (!row.habilitado && !row.email) {
      alert("Para habilitar al buzo primero debes registrar su correo electrónico: es el correo con el que creará su cuenta.");
      return;
    }
    const accion = row.habilitado ? "deshabilitar" : "habilitar";
    if (!confirm(`¿Seguro que quieres ${accion} a ${row.nombre_buzo}?`)) return;
    const err = await update({ id_buzo: row.id_buzo }, { habilitado: !row.habilitado });
    if (err) alert(mensajeDeError({ message: err }, accion));
  }

  async function handleDelete(row: Tables<"buzo">) {
    if (!confirm(`¿Eliminar a ${row.nombre_buzo}?`)) return;
    const err = await remove({ id_buzo: row.id_buzo });
    if (err) alert(mensajeDeError({ message: err }, "eliminar"));
  }

  const columns: Column<Tables<"buzo">>[] = [
    { header: "Nombre", cell: (r) => r.nombre_buzo },
    { header: "RUT", cell: (r) => r.rut_buzo },
    { header: "Correo", cell: (r) => r.email ?? "—" },
    { header: "Clase / matrícula", cell: (r) => r.clase_matricula ?? "—" },
    { header: "Venc. hiperbárico", cell: (r) => formatDate(r.vencimiento_hipervarico) },
    {
      header: "Ordenador asignado",
      cell: (r) => equipos.find((e) => e.id_equipo === r.id_equipo_asignado)?.nombre_ordenador ?? "—",
    },
    { header: "Estado", cell: (r) => <Badge tone={r.estado}>{r.estado}</Badge> },
    {
      header: "Acceso",
      cell: (r) => (
        <Badge tone={r.habilitado ? "activo" : "inactivo"}>
          {r.habilitado ? "habilitado" : "deshabilitado"}
        </Badge>
      ),
    },
    {
      header: "",
      cell: (r) =>
        esEditor ? (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => toggleHabilitado(r)}>
              {r.habilitado ? "Deshabilitar" : "Habilitar"}
            </button>
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
          <h1 className="text-xl font-semibold text-slate-50">Buzos</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nuevo buzo
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyFn={(r) => r.id_buzo} emptyMessage="Aún no hay buzos registrados." />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo buzo" : "Editar buzo"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="RUT"
              required
              value={form.rut_buzo}
              onChange={(e) => setForm({ ...form, rut_buzo: e.target.value })}
              onBlur={(e) => setForm({ ...form, rut_buzo: formatRut(e.target.value) })}
              placeholder="12.345.678-9"
              error={errors.rut_buzo}
            />
            <TextField
              label="Nombre completo"
              required
              value={form.nombre_buzo}
              onChange={(e) => setForm({ ...form, nombre_buzo: e.target.value })}
              error={errors.nombre_buzo}
            />
            <TextField
              label="Correo electrónico"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="buzo@correo.cl"
              error={errors.email}
            />
            <p className="-mt-2 text-xs text-slate-500">
              Es el correo con el que el buzo creará su cuenta. Solo podrá registrarse cuando lo habilites.
            </p>
            <TextField
              label="Clase / matrícula"
              value={form.clase_matricula ?? ""}
              onChange={(e) => setForm({ ...form, clase_matricula: e.target.value })}
            />
            <TextField
              label="Vencimiento hiperbárico"
              type="date"
              value={form.vencimiento_hipervarico ?? ""}
              onChange={(e) => setForm({ ...form, vencimiento_hipervarico: e.target.value })}
            />
            <SelectField
              label="Estado"
              required
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as BuzoForm["estado"] })}
              options={ESTADOS.map((v) => ({ value: v, label: v }))}
            />
            <SelectField
              label="Ordenador asignado"
              value={form.id_equipo_asignado ?? ""}
              onChange={(e) => setForm({ ...form, id_equipo_asignado: e.target.value })}
              options={equipos.map((eq) => ({ value: eq.id_equipo, label: eq.nombre_ordenador }))}
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
