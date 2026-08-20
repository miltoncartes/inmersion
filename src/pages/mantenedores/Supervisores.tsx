import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supervisorSchema, type SupervisorForm } from "../../lib/validators";
import { mensajeDeError } from "../../lib/errores";
import { formatRut, formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField } from "../../components/FormField";
import { Badge } from "../../components/Badge";
import type { Tables } from "../../lib/types";

const empty: SupervisorForm = {
  rut_super: "",
  nombre_super: "",
  email: "",
  fecha_vencimiento_matricula: "",
};

function estadoVencimiento(fecha: string | null): "activo" | "por_vencer" | "vencido" | null {
  if (!fecha) return null;
  const dias = (new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (dias < 0) return "vencido";
  if (dias <= 30) return "por_vencer";
  return "activo";
}

export function Supervisores() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("supervisor", "nombre_super");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"supervisor">>(null);
  const [form, setForm] = useState<SupervisorForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"supervisor">) {
    setForm({
      rut_super: row.rut_super,
      nombre_super: row.nombre_super,
      email: row.email ?? "",
      fecha_vencimiento_matricula: row.fecha_vencimiento_matricula ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = supervisorSchema.safeParse({ ...form, rut_super: formatRut(form.rut_super) });
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
      fecha_vencimiento_matricula: parsed.data.fecha_vencimiento_matricula || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_supervisor: (modal as Tables<"supervisor">).id_supervisor }, payload);
    setSaving(false);
    if (err) setErrors({ _global: mensajeDeError({ message: err }) });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"supervisor">) {
    if (!confirm(`¿Eliminar a ${row.nombre_super}? Esta acción no se puede deshacer.`)) return;
    const err = await remove({ id_supervisor: row.id_supervisor });
    if (err) alert(mensajeDeError({ message: err }, "eliminar el supervisor"));
  }

  const columns: Column<Tables<"supervisor">>[] = [
    {
      header: "Nombre",
      cell: (r) => r.nombre_super,
      className: "whitespace-nowrap font-medium min-w-[230px]",
    },
    { header: "RUT", cell: (r) => r.rut_super, className: "whitespace-nowrap min-w-[120px]" },
    { header: "Correo", cell: (r) => r.email ?? "—", className: "whitespace-nowrap" },
    {
      header: "Venc. matrícula",
      cell: (r) => formatDate(r.fecha_vencimiento_matricula),
      className: "whitespace-nowrap",
    },
    {
      header: "Estado matrícula",
      className: "whitespace-nowrap",
      cell: (r) => {
        const estado = estadoVencimiento(r.fecha_vencimiento_matricula);
        return estado ? (
          <Badge tone={estado}>{estado.replace("_", " ")}</Badge>
        ) : (
          <span className="text-slate-500">—</span>
        );
      },
    },
    {
      header: "",
      className: "whitespace-nowrap",
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
          <h1 className="text-xl font-semibold text-slate-50">Supervisores</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nuevo supervisor
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyFn={(r) => r.id_supervisor} emptyMessage="Aún no hay supervisores registrados." />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo supervisor" : "Editar supervisor"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="RUT"
              required
              value={form.rut_super}
              onChange={(e) => setForm({ ...form, rut_super: e.target.value })}
              onBlur={(e) => setForm({ ...form, rut_super: formatRut(e.target.value) })}
              placeholder="12.345.678-9"
              error={errors.rut_super}
            />
            <TextField
              label="Nombre completo"
              required
              value={form.nombre_super}
              onChange={(e) => setForm({ ...form, nombre_super: e.target.value })}
              error={errors.nombre_super}
            />
            <TextField
              label="Correo electrónico"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="supervisor@correo.cl"
              error={errors.email}
            />
            <TextField
              label="Vencimiento de matrícula"
              type="date"
              value={form.fecha_vencimiento_matricula ?? ""}
              onChange={(e) => setForm({ ...form, fecha_vencimiento_matricula: e.target.value })}
              error={errors.fecha_vencimiento_matricula}
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
