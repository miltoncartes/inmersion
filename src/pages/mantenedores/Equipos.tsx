import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supabase } from "../../lib/supabaseClient";
import { equipoSchema, type EquipoForm } from "../../lib/validators";
import { formatDate } from "../../lib/format";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, SelectField } from "../../components/FormField";
import { Badge } from "../../components/Badge";
import type { Tables } from "../../lib/types";

const empty: EquipoForm = {
  matricula_equipo: "",
  vencimiento_equipo: "",
  id_masc: "",
  id_botella_aux: "",
  id_botella_emer: "",
  numero_serie_consola_aire: "",
  fecha_calibracion_consola_aire: "",
  numero_serie_consola_comunicaciones: "",
  fecha_mantencion_consola_comunicaciones: "",
  numero_serie_cargador_alta_presion: "",
  fecha_mantencion_cargador_alta_presion: "",
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

const CLAVE_COLUMNAS = "mdibuceo_equipos_columnas";
const COLUMNAS_POR_DEFECTO = ["vencimiento", "estado"];

export function Equipos() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove } = useCrud("equipos", "matricula_equipo");
  const [mascaras, setMascaras] = useState<Tables<"mascaras">[]>([]);
  const [botellasAux, setBotellasAux] = useState<Tables<"botellas_aux">[]>([]);
  const [botellasEmer, setBotellasEmer] = useState<Tables<"botellas_emer">[]>([]);
  const [modal, setModal] = useState<null | "nuevo" | Tables<"equipos">>(null);
  const [form, setForm] = useState<EquipoForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_COLUMNAS);
      return guardado ? JSON.parse(guardado) : COLUMNAS_POR_DEFECTO;
    } catch {
      return COLUMNAS_POR_DEFECTO;
    }
  });
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, ba, be] = await Promise.all([
        supabase.from("mascaras").select("*").order("nombre_masc"),
        supabase.from("botellas_aux").select("*").order("nombre_botella_aux"),
        supabase.from("botellas_emer").select("*").order("nombre_botella_emer"),
      ]);
      setMascaras(m.data ?? []);
      setBotellasAux(ba.data ?? []);
      setBotellasEmer(be.data ?? []);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(CLAVE_COLUMNAS, JSON.stringify(columnasVisibles));
  }, [columnasVisibles]);

  function alternarColumna(id: string) {
    setColumnasVisibles((cols) => (cols.includes(id) ? cols.filter((c) => c !== id) : [...cols, id]));
  }

  function openNuevo() {
    setForm(empty);
    setErrors({});
    setModal("nuevo");
  }
  function openEditar(row: Tables<"equipos">) {
    setForm({
      matricula_equipo: row.matricula_equipo ?? "",
      vencimiento_equipo: row.vencimiento_equipo ?? "",
      id_masc: row.id_masc ?? "",
      id_botella_aux: row.id_botella_aux ?? "",
      id_botella_emer: row.id_botella_emer ?? "",
      numero_serie_consola_aire: row.numero_serie_consola_aire ?? "",
      fecha_calibracion_consola_aire: row.fecha_calibracion_consola_aire ?? "",
      numero_serie_consola_comunicaciones: row.numero_serie_consola_comunicaciones ?? "",
      fecha_mantencion_consola_comunicaciones: row.fecha_mantencion_consola_comunicaciones ?? "",
      numero_serie_cargador_alta_presion: row.numero_serie_cargador_alta_presion ?? "",
      fecha_mantencion_cargador_alta_presion: row.fecha_mantencion_cargador_alta_presion ?? "",
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
    const d = parsed.data;
    const payload = {
      matricula_equipo: d.matricula_equipo,
      vencimiento_equipo: d.vencimiento_equipo,
      id_masc: d.id_masc || null,
      id_botella_aux: d.id_botella_aux || null,
      id_botella_emer: d.id_botella_emer || null,
      numero_serie_consola_aire: d.numero_serie_consola_aire || null,
      fecha_calibracion_consola_aire: d.fecha_calibracion_consola_aire || null,
      numero_serie_consola_comunicaciones: d.numero_serie_consola_comunicaciones || null,
      fecha_mantencion_consola_comunicaciones: d.fecha_mantencion_consola_comunicaciones || null,
      numero_serie_cargador_alta_presion: d.numero_serie_cargador_alta_presion || null,
      fecha_mantencion_cargador_alta_presion: d.fecha_mantencion_cargador_alta_presion || null,
    };
    const err =
      modal === "nuevo"
        ? await insert(payload)
        : await update({ id_equipo: (modal as Tables<"equipos">).id_equipo }, payload);
    setSaving(false);
    if (err) setErrors({ _global: err });
    else setModal(null);
  }

  async function handleDelete(row: Tables<"equipos">) {
    if (!confirm(`¿Eliminar el equipo ${row.matricula_equipo ?? "sin matrícula"}?`)) return;
    const err = await remove({ id_equipo: row.id_equipo });
    if (err) alert("No se pudo eliminar: " + err);
  }

  const columnasOpcionales: (Column<Tables<"equipos">> & { id: string })[] = [
    {
      id: "vencimiento",
      header: "Vencimiento",
      cell: (r) => formatDate(r.vencimiento_equipo),
    },
    {
      id: "estado",
      header: "Estado",
      cell: (r) => {
        const estado = estadoVencimiento(r.vencimiento_equipo);
        return estado ? <Badge tone={estado}>{estado.replace("_", " ")}</Badge> : <span className="text-slate-500">—</span>;
      },
    },
    {
      id: "mascara",
      header: "Máscara",
      cell: (r) => mascaras.find((m) => m.id_masc === r.id_masc)?.nombre_masc ?? "—",
    },
    {
      id: "botella_aux",
      header: "Botella banco auxiliar",
      cell: (r) => botellasAux.find((b) => b.id_botella_aux === r.id_botella_aux)?.nombre_botella_aux ?? "—",
    },
    {
      id: "botella_emer",
      header: "Botella banco emergencia",
      cell: (r) => botellasEmer.find((b) => b.id_botella_emer === r.id_botella_emer)?.nombre_botella_emer ?? "—",
    },
    {
      id: "serie_consola_aire",
      header: "N° serie consola de aire",
      cell: (r) => r.numero_serie_consola_aire ?? "—",
    },
    {
      id: "fecha_calibracion_consola_aire",
      header: "Fecha calibración consola aire",
      cell: (r) => formatDate(r.fecha_calibracion_consola_aire),
    },
    {
      id: "serie_consola_comunicaciones",
      header: "N° serie consola de comunicaciones",
      cell: (r) => r.numero_serie_consola_comunicaciones ?? "—",
    },
    {
      id: "fecha_mantencion_consola_comunicaciones",
      header: "Fecha mantención consola comunicaciones",
      cell: (r) => formatDate(r.fecha_mantencion_consola_comunicaciones),
    },
    {
      id: "serie_cargador_alta_presion",
      header: "N° serie cargador alta presión",
      cell: (r) => r.numero_serie_cargador_alta_presion ?? "—",
    },
    {
      id: "fecha_mantencion_cargador_alta_presion",
      header: "Fecha mantención cargador alta presión",
      cell: (r) => formatDate(r.fecha_mantencion_cargador_alta_presion),
    },
  ];

  const columns: Column<Tables<"equipos">>[] = [
    { header: "Matrícula", cell: (r) => r.matricula_equipo ?? "—" },
    ...columnasOpcionales.filter((c) => columnasVisibles.includes(c.id)),
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

      <div className="mb-3 flex justify-end">
        <div className="relative">
          <button className="btn-secondary" onClick={() => setSelectorAbierto((v) => !v)}>
            Columnas ({columnasVisibles.length})
          </button>
          {selectorAbierto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSelectorAbierto(false)} />
              <div className="card absolute right-0 top-11 z-20 w-72 p-4">
                <p className="eyebrow mb-2">Elige qué columnas mostrar</p>
                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {columnasOpcionales.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded px-1 py-1.5 text-sm text-slate-200 hover:bg-navy-800">
                      <input
                        type="checkbox"
                        checked={columnasVisibles.includes(c.id)}
                        onChange={() => alternarColumna(c.id)}
                      />
                      {c.header}
                    </label>
                  ))}
                </div>
                <p className="mt-2 border-t border-navy-700/70 pt-2 text-xs text-slate-500">
                  La selección se recuerda la próxima vez que entres a este mantenedor.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          keyFn={(r) => r.id_equipo}
          emptyMessage="Aún no hay equipos registrados."
        />
      )}

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo equipo" : "Editar equipo"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <TextField
              label="Matrícula del equipo"
              required
              value={form.matricula_equipo}
              onChange={(e) => setForm({ ...form, matricula_equipo: e.target.value })}
              placeholder="Ej: EQ-2026-014"
              error={errors.matricula_equipo}
            />
            <TextField
              label="Vencimiento del equipo"
              type="date"
              required
              value={form.vencimiento_equipo}
              onChange={(e) => setForm({ ...form, vencimiento_equipo: e.target.value })}
              error={errors.vencimiento_equipo}
            />
            <SelectField
              label="Máscara"
              value={form.id_masc ?? ""}
              onChange={(e) => setForm({ ...form, id_masc: e.target.value })}
              options={mascaras.map((m) => ({ value: m.id_masc, label: m.nombre_masc }))}
            />
            <SelectField
              label="Botella banco auxiliar"
              value={form.id_botella_aux ?? ""}
              onChange={(e) => setForm({ ...form, id_botella_aux: e.target.value })}
              options={botellasAux.map((b) => ({ value: b.id_botella_aux, label: b.nombre_botella_aux }))}
            />
            <SelectField
              label="Botella banco emergencia"
              value={form.id_botella_emer ?? ""}
              onChange={(e) => setForm({ ...form, id_botella_emer: e.target.value })}
              options={botellasEmer.map((b) => ({ value: b.id_botella_emer, label: b.nombre_botella_emer }))}
            />
            <TextField
              label="N° serie consola de aire"
              value={form.numero_serie_consola_aire ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_consola_aire: e.target.value })}
            />
            <TextField
              label="Fecha calibración consola de aire"
              type="date"
              value={form.fecha_calibracion_consola_aire ?? ""}
              onChange={(e) => setForm({ ...form, fecha_calibracion_consola_aire: e.target.value })}
            />
            <TextField
              label="N° serie consola de comunicaciones"
              value={form.numero_serie_consola_comunicaciones ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_consola_comunicaciones: e.target.value })}
            />
            <TextField
              label="Fecha mantención consola de comunicaciones"
              type="date"
              value={form.fecha_mantencion_consola_comunicaciones ?? ""}
              onChange={(e) => setForm({ ...form, fecha_mantencion_consola_comunicaciones: e.target.value })}
            />
            <TextField
              label="N° serie cargador de alta presión"
              value={form.numero_serie_cargador_alta_presion ?? ""}
              onChange={(e) => setForm({ ...form, numero_serie_cargador_alta_presion: e.target.value })}
            />
            <TextField
              label="Fecha mantención cargador de alta presión"
              type="date"
              value={form.fecha_mantencion_cargador_alta_presion ?? ""}
              onChange={(e) => setForm({ ...form, fecha_mantencion_cargador_alta_presion: e.target.value })}
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
