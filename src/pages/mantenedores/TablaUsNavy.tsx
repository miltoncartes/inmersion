import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { tablaUsNavySchema, type TablaUsNavyForm } from "../../lib/validators";
import { mensajeDeError } from "../../lib/errores";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: TablaUsNavyForm = { composicion: "", observacion: "" };

export function TablaUsNavy() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("tabla_us_navy", "composicion");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"tabla_us_navy">>(null);
  const [form, setForm] = useState<TablaUsNavyForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"tabla_us_navy">) {
    setForm({ composicion: row.composicion, observacion: row.observacion ?? "" });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = tablaUsNavySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const payload = { ...parsed.data, observacion: parsed.data.observacion || null };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_navy: (modal as Tables<"tabla_us_navy">).id_navy }, payload);
    setSaving(false);
    if (err) setErrors({ _global: mensajeDeError({ message: err }) });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"tabla_us_navy">) {
    if (!confirm(`¿Eliminar la composición ${row.composicion}?`)) return;
    const err = await remove({ id_navy: row.id_navy });
    if (err) alert(mensajeDeError({ message: err }, "eliminar"));
  }

  const columns: Column<Tables<"tabla_us_navy">>[] = [
    { header: "Composición", cell: (r) => r.composicion },
    { header: "Observación", cell: (r) => r.observacion ?? "—" },
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
          <h1 className="text-xl font-semibold text-slate-50">Tabla US Navy</h1>
          <p className="mt-1 text-sm text-slate-400">
            Las composiciones que cargues aquí son las que aparecen en el listado de tabulación al registrar una inmersión.
          </p>
        </div>
        {esEditor && (
          <button className="btn-primary shrink-0" onClick={openNuevo}>
            + Nueva composición
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFn={(r) => r.id_navy}
          emptyMessage="Aún no hay composiciones cargadas. Agrega la primera para poder usarla en las inmersiones."
        />
      )}

      {modal && (
        <Modal
          title={modal === "nuevo" ? "Nueva composición" : "Editar composición"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-4">
            <TextField
              label="Composición"
              required
              value={form.composicion}
              onChange={(e) => setForm({ ...form, composicion: e.target.value })}
              placeholder="Ej: 16.8/74"
              error={errors.composicion}
            />
            <TextareaField
              label="Observación"
              rows={3}
              value={form.observacion ?? ""}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
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
