import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supabase } from "../../lib/supabaseClient";
import { clienteSchema, centroCultivoSchema, type ClienteForm } from "../../lib/validators";
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
    if (modal === "nuevo") {
      const err = await insert(payload);
      setSaving(false);
      if (err) setErrors({ _global: err });
      else setModal(null);
    } else {
      const err = await update({ id_cliente: (modal as Tables<"cliente">).id_cliente }, payload);
      setSaving(false);
      if (err) setErrors({ _global: err });
      // Al editar, no cerramos: se queda en el modal para seguir administrando centros de cultivo.
    }
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

            {modal !== "nuevo" && (
              <CentrosCultivo idCliente={(modal as Tables<"cliente">).id_cliente} puedeEditar={esEditor} puedeBorrar={esAdmin} />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function CentrosCultivo({
  idCliente,
  puedeEditar,
  puedeBorrar,
}: {
  idCliente: string;
  puedeEditar: boolean;
  puedeBorrar: boolean;
}) {
  const [centros, setCentros] = useState<Tables<"centro_cultivo">[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const { data } = await supabase
      .from("centro_cultivo")
      .select("*")
      .eq("id_cliente", idCliente)
      .order("nombre_centro");
    setCentros(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCliente]);

  async function agregar() {
    const parsed = centroCultivoSchema.safeParse({ nombre_centro: nombreNuevo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nombre inválido");
      return;
    }
    setError(null);
    setSaving(true);
    const { error: err } = await supabase
      .from("centro_cultivo")
      .insert({ id_cliente: idCliente, nombre_centro: parsed.data.nombre_centro });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setNombreNuevo("");
    await reload();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este centro de cultivo?")) return;
    const { error: err } = await supabase.from("centro_cultivo").delete().eq("id_centro_cultivo", id);
    if (err) {
      alert("No se pudo eliminar: " + err.message);
      return;
    }
    await reload();
  }

  return (
    <div className="border-t border-navy-700/70 pt-4">
      <p className="eyebrow mb-3">Centros de cultivo</p>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : centros.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">Este cliente aún no tiene centros de cultivo.</p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {centros.map((c) => (
            <li key={c.id_centro_cultivo} className="flex items-center justify-between rounded-lg bg-navy-900/50 px-3 py-2 text-sm">
              <span className="text-slate-200">{c.nombre_centro}</span>
              {puedeBorrar && (
                <button className="btn-ghost text-red-400" onClick={() => eliminar(c.id_centro_cultivo)}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {puedeEditar && (
        <div className="flex gap-2">
          <input
            className="field-input"
            placeholder="Nombre del centro de cultivo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
          />
          <button className="btn-secondary shrink-0" onClick={agregar} disabled={saving}>
            {saving ? "Agregando…" : "+ Agregar"}
          </button>
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
