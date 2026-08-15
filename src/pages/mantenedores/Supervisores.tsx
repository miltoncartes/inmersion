import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supervisorSchema, type SupervisorForm } from "../../lib/validators";
import { formatRut } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: SupervisorForm = { rut_super: "", nombre_super: "" };

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
    setForm({ rut_super: row.rut_super, nombre_super: row.nombre_super });
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
    const err =
      modal === "nuevo"
        ? await insert(parsed.data)
        : await update({ id_supervisor: (modal as Tables<"supervisor">).id_supervisor }, parsed.data);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"supervisor">) {
    if (!confirm(`¿Eliminar a ${row.nombre_super}?`)) return;
    const err = await remove({ id_supervisor: row.id_supervisor });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"supervisor">>[] = [
    { header: "Nombre", cell: (r) => r.nombre_super },
    { header: "RUT", cell: (r) => r.rut_super },
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
