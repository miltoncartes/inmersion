import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { botellaEmerSchema, type BotellaEmerForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: BotellaEmerForm = { nombre_botella_emer: "", fecha_venc_emer: "", observacion: "" };

export function BotellasEmer() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("botellas_emer", "nombre_botella_emer");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"botellas_emer">>(null);
  const [form, setForm] = useState<BotellaEmerForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"botellas_emer">) {
    setForm({
      nombre_botella_emer: row.nombre_botella_emer,
      fecha_venc_emer: row.fecha_venc_emer ?? "",
      observacion: row.observacion ?? "",
    });
    setErrors({});
    setModal(row);
  }

  async function handleSubmit() {
    const parsed = botellaEmerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fieldErrors[i.path[0] as string] = i.message));
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      fecha_venc_emer: parsed.data.fecha_venc_emer || null,
      observacion: parsed.data.observacion || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_botella_emer: (modal as Tables<"botellas_emer">).id_botella_emer }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"botellas_emer">) {
    if (!confirm(`¿Eliminar la botella ${row.nombre_botella_emer}?`)) return;
    const err = await remove({ id_botella_emer: row.id_botella_emer });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"botellas_emer">>[] = [
    { header: "Nombre", cell: (r) => r.nombre_botella_emer },
    { header: "Vencimiento", cell: (r) => formatDate(r.fecha_venc_emer) },
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
          <h1 className="text-xl font-semibold text-slate-50">Botellas banco emergencia</h1>
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
          keyFn={(r) => r.id_botella_emer}
          emptyMessage="Aún no hay botellas de emergencia registradas."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nueva botella de emergencia" : "Editar botella de emergencia"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Nombre"
              required
              value={form.nombre_botella_emer}
              onChange={(e) => setForm({ ...form, nombre_botella_emer: e.target.value })}
              placeholder="Ej: Botella Emer BE-007"
              error={errors.nombre_botella_emer}
            />
            <TextField
              label="Fecha de vencimiento"
              type="date"
              value={form.fecha_venc_emer ?? ""}
              onChange={(e) => setForm({ ...form, fecha_venc_emer: e.target.value })}
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
