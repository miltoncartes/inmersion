import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { botellaAuxSchema, type BotellaAuxForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: BotellaAuxForm = { nombre_botella_aux: "", fecha_venc_aux: "", observacion: "" };

export function BotellasAux() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("botellas_aux", "nombre_botella_aux");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"botellas_aux">>(null);
  const [form, setForm] = useState<BotellaAuxForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"botellas_aux">) {
    setForm({
      nombre_botella_aux: row.nombre_botella_aux,
      fecha_venc_aux: row.fecha_venc_aux ?? "",
      observacion: row.observacion ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = botellaAuxSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      fecha_venc_aux: parsed.data.fecha_venc_aux || null,
      observacion: parsed.data.observacion || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_botella_aux: (modal as Tables<"botellas_aux">).id_botella_aux }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"botellas_aux">) {
    if (!confirm(`¿Eliminar la botella ${row.nombre_botella_aux}?`)) return;
    const err = await remove({ id_botella_aux: row.id_botella_aux });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"botellas_aux">>[] = [
    { header: "N° de serie", cell: (r) => r.nombre_botella_aux },
    { header: "Vencimiento", cell: (r) => formatDate(r.fecha_venc_aux) },
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
          <h1 className="text-xl font-semibold text-slate-50">Botellas banco auxiliar</h1>
        </div>
        {esEditor && (
          <button className="btn-primary" onClick={openNuevo}>
            + Nueva botella
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFn={(r) => r.id_botella_aux}
          emptyMessage="Aún no hay botellas auxiliares registradas."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nueva botella auxiliar" : "Editar botella auxiliar"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Número de serie de botella"
              required
              value={form.nombre_botella_aux}
              onChange={(e) => setForm({ ...form, nombre_botella_aux: e.target.value })}
              placeholder="Ej: BA-014"
              error={errors.nombre_botella_aux}
            />
            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={form.fecha_venc_aux ?? ""}
              onChange={(e) => setForm({ ...form, fecha_venc_aux: e.target.value })}
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
