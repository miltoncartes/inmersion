import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { equipoSchema, type EquipoForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField } from "../../components/FormField";
import { Badge } from "../../components/Badge";
import type { Tables } from "../../lib/types";

const empty: EquipoForm = {
  numero_serie_ordenador: "",
  tipo_equipo_buceo: "",
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
  const { rows, loading, insert, update, remove } = useCrud("equipos", "numero_serie_ordenador");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"equipos">>(null);
  const [form, setForm] = useState<EquipoForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"equipos">) {
    setForm({
      numero_serie_ordenador: row.numero_serie_ordenador,
      tipo_equipo_buceo: row.tipo_equipo_buceo,
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
    const payload = {
      ...parsed.data,
      matricula_equipo: parsed.data.matricula_equipo || null,
      vencimiento_equipo: parsed.data.vencimiento_equipo || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ numero_serie_ordenador: (modal as Tables<"equipos">).numero_serie_ordenador }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"equipos">) {
    if (!confirm(`¿Eliminar el equipo ${row.numero_serie_ordenador}?`)) return;
    const err = await remove({ numero_serie_ordenador: row.numero_serie_ordenador });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columns: Column<Tables<"equipos">>[] = [
    { header: "N° serie", cell: (r) => r.numero_serie_ordenador },
    { header: "Tipo", cell: (r) => r.tipo_equipo_buceo },
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
          keyFn={(r) => r.numero_serie_ordenador}
          emptyMessage="Aún no hay equipos registrados."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo equipo" : "Editar equipo"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Número de serie del ordenador"
              required
              disabled={modal !== "nuevo"}
              value={form.numero_serie_ordenador}
              onChange={(e) => setForm({ ...form, numero_serie_ordenador: e.target.value })}
              placeholder="ORD-2231"
              error={errors.numero_serie_ordenador}
            />
            <TextField
              label="Tipo de equipo"
              required
              value={form.tipo_equipo_buceo}
              onChange={(e) => setForm({ ...form, tipo_equipo_buceo: e.target.value })}
              placeholder="Ej: Semi-autónomo"
              error={errors.tipo_equipo_buceo}
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
