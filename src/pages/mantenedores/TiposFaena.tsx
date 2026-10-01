import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { tipoFaenaSchema, type TipoFaenaForm } from "../../lib/validators";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: TipoFaenaForm = { nombre: "", observacion: "" };

// Catalogo de categorias de faena (limpieza de redes, cambio de fondos, etc.).
// faena_realizada sigue siendo texto libre en la inmersion para el detalle;
// este catalogo es lo que permite agrupar por tipo en los reportes.
export function TiposFaena() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("tipos_faena", "nombre");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"tipos_faena">>(null);
  const [form, setForm] = useState<TipoFaenaForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"tipos_faena">) {
    setForm({ nombre: row.nombre, observacion: row.observacion ?? "" });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = tipoFaenaSchema.safeParse(form);
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
        : await update({ id_tipo_faena: (modal as Tables<"tipos_faena">).id_tipo_faena }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"tipos_faena">) {
    if (!confirm(`¿Eliminar el tipo de faena "${row.nombre}"?`)) return;
    const err = await remove({ id_tipo_faena: row.id_tipo_faena });
    // Si ya se usó en alguna inmersión, la base rechaza el borrado
    // (ON DELETE RESTRICT) y el mensaje crudo de Postgres llega aquí.
    if (err) alert(err.includes("foreign key") ? "No se puede eliminar: ya está asignado a una o más inmersiones." : "No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"tipos_faena">>[] = [
    { header: "Nombre", cell: (r) => r.nombre, className: "font-medium" },
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
          <h1 className="text-xl font-semibold text-slate-50">Tipos de faena</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nuevo tipo de faena
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFn={(r) => r.id_tipo_faena}
          emptyMessage="Aún no hay tipos de faena registrados."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo tipo de faena" : "Editar tipo de faena"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Limpieza de redes"
              error={errors.nombre}
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
