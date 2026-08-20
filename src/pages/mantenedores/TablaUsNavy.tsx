import { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../../lib/auth";
import { useCrud } from "../../lib/useCrud";
import { supabase } from "../../lib/supabaseClient";
import { tablaUsNavySchema, type TablaUsNavyForm } from "../../lib/validators";
import { mensajeDeError } from "../../lib/errores";
import { parseCsv, quitarEncabezado } from "../../lib/csv";
import { DataTable, type Column } from "../../components/DataTable";
import { Modal } from "../../components/Modal";
import { TextField, TextareaField } from "../../components/FormField";
import type { Tables } from "../../lib/types";

const empty: TablaUsNavyForm = { composicion: "", observacion: "" };

export function TablaUsNavy() {
  const { esEditor, esAdmin } = useAuth();
  const { rows, loading, insert, update, remove, reload } = useCrud("tabla_us_navy", "composicion");
  const [modal, setModal] = useState<null | "nuevo" | Tables<"tabla_us_navy">>(null);
  const [form, setForm] = useState<TablaUsNavyForm>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<string | null>(null);
  const [errorImport, setErrorImport] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  async function handleArchivoCsv(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setErrorImport(null);
    setResultadoImport(null);
    setImportando(true);

    try {
      const filas = quitarEncabezado(parseCsv(await archivo.text()), [
        "composicion",
        "composición",
      ]);

      if (filas.length === 0) {
        setErrorImport("El archivo no tiene filas con datos.");
        return;
      }

      // Primera columna = composición, segunda (opcional) = observación.
      const existentes = new Set(rows.map((r) => r.composicion.toLowerCase()));
      const vistas = new Set<string>();
      const nuevas: { composicion: string; observacion: string | null }[] = [];
      let omitidasVacias = 0;
      let omitidasRepetidas = 0;

      for (const fila of filas) {
        const composicion = (fila[0] ?? "").trim();
        if (!composicion) {
          omitidasVacias++;
          continue;
        }
        const clave = composicion.toLowerCase();
        if (existentes.has(clave) || vistas.has(clave)) {
          omitidasRepetidas++;
          continue;
        }
        vistas.add(clave);
        nuevas.push({ composicion, observacion: (fila[1] ?? "").trim() || null });
      }

      if (nuevas.length === 0) {
        setErrorImport(
          `No hay composiciones nuevas para cargar (${omitidasRepetidas} ya existían, ${omitidasVacias} filas vacías).`
        );
        return;
      }

      const { error } = await supabase.from("tabla_us_navy").insert(nuevas);
      if (error) {
        setErrorImport(mensajeDeError(error, "importar el archivo"));
        return;
      }

      const detalles = [
        `${nuevas.length} ${nuevas.length === 1 ? "composición cargada" : "composiciones cargadas"}`,
      ];
      if (omitidasRepetidas > 0) detalles.push(`${omitidasRepetidas} repetidas omitidas`);
      if (omitidasVacias > 0) detalles.push(`${omitidasVacias} filas vacías omitidas`);
      setResultadoImport(detalles.join(" · "));
      await reload();
    } catch (err) {
      setErrorImport(mensajeDeError(err, "leer el archivo CSV"));
    } finally {
      setImportando(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  }

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
          <div className="flex shrink-0 gap-2">
            <button
              className="btn-secondary"
              onClick={() => inputArchivo.current?.click()}
              disabled={importando}
            >
              {importando ? "Importando…" : "Carga masiva CSV"}
            </button>
            <button className="btn-primary" onClick={openNuevo}>
              + Nueva composición
            </button>
          </div>
        )}
      </div>

      {esEditor && (
        <>
          <input
            ref={inputArchivo}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleArchivoCsv}
          />
          <div className="card mb-4 p-4">
            <p className="eyebrow mb-2">Carga masiva desde CSV</p>
            <p className="text-sm text-slate-400">
              El archivo debe tener la <strong className="text-slate-200">composición</strong> en la primera columna y,
              opcionalmente, la <strong className="text-slate-200">observación</strong> en la segunda. Acepta separador
              coma o punto y coma, con o sin fila de encabezado. Las composiciones que ya existen se omiten.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-navy-950/60 p-3 text-xs text-slate-300">
{`composicion,observacion
16.8/74,Grupo 1
18.3/63,Grupo 2
21.3/48,`}
            </pre>
            {resultadoImport && <p className="mt-3 text-sm text-emerald-400">{resultadoImport}</p>}
            {errorImport && <p className="mt-3 text-sm text-red-400">{errorImport}</p>}
          </div>
        </>
      )}

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
