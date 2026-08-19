import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { mascaraSchema, type MascaraForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: MascaraForm = { nombre_masc: "", fecha_mant_masc: "", observacion: "" };

export function Mascaras() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("mascaras", "nombre_masc");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"mascaras">>(null);
  const [form, setForm] = useState<MascaraForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"mascaras">) {
    setForm({
      nombre_masc: row.nombre_masc,
      fecha_mant_masc: row.fecha_mant_masc ?? "",
      observacion: row.observacion ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = mascaraSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      fecha_mant_masc: parsed.data.fecha_mant_masc || null,
      observacion: parsed.data.observacion || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_masc: (modal as Tables<"mascaras">).id_masc }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"mascaras">) {
    if (!confirm(`¿Eliminar la máscara ${row.nombre_masc}?`)) return;
    const err = await remove({ id_masc: row.id_masc });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"mascaras">>[] = [
    { header: "Nombre", cell: (r) => r.nombre_masc },
    { header: "Mantención", cell: (r) => formatDate(r.fecha_mant_masc) },
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
          <h1 className="text-xl font-semibold text-slate-50">Máscaras</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nueva máscara
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyFn={(r) => r.id_masc} emptyMessage="Aún no hay máscaras registradas." />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nueva máscara" : "Editar máscara"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Nombre"
              required
              value={form.nombre_masc}
              onChange={(e) => setForm({ ...form, nombre_masc: e.target.value })}
              placeholder="Ej: Máscara MSC-001"
              error={errors.nombre_masc}
            />
            <TextField
              label="Fecha de mantención"
              type="date"
              value={form.fecha_mant_masc ?? ""}
              onChange={(e) => setForm({ ...form, fecha_mant_masc: e.target.value })}
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
