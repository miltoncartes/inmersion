import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { clienteSchema, type ClienteForm } from "../../lib/validators";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: ClienteForm = { nombre_cliente: "", observacion: "" };

export function Clientes() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("cliente", "nombre_cliente");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"cliente">>(null);
  const [form, setForm] = useState<ClienteForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"cliente">) {
    setForm({ nombre_cliente: row.nombre_cliente, observacion: row.observacion ?? "" });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = clienteSchema.safeParse(form);
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
        : await update({ id_cliente: (modal as Tables<"cliente">).id_cliente }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"cliente">) {
    if (!confirm(`¿Eliminar a ${row.nombre_cliente}?`)) return;
    const err = await remove({ id_cliente: row.id_cliente });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"cliente">>[] = [
    { header: "Nombre", cell: (r) => r.nombre_cliente },
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
          <h1 className="text-xl font-semibold text-slate-50">Clientes</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nuevo cliente
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyFn={(r) => r.id_cliente} emptyMessage="Aún no hay clientes registrados." />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Nombre"
              required
              value={form.nombre_cliente}
              onChange={(e) => setForm({ ...form, nombre_cliente: e.target.value })}
              error={errors.nombre_cliente}
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
