import { useState } from "react";
import { useCrud } from "../lib/useCrud";
import { DataTable, type Column } from "../components/DataTable";
import { Badge } from "../components/Badge";
import type { Tables, UserRole } from "../lib/types";

const ROLES: UserRole[] = ["admin", "supervisor", "lectura"];

export function Usuarios() {
  const { rows, loading, update } = useCrud("usuarios_app", "nombre");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function cambiarRol(row: Tables<"usuarios_app">, rol: UserRole) {
    setSavingId(row.id);
    await update({ id: row.id }, { rol });
    setSavingId(null);
  }

  async function cambiarActivo(row: Tables<"usuarios_app">, activo: boolean) {
    setSavingId(row.id);
    await update({ id: row.id }, { activo });
    setSavingId(null);
  }

  const columns: Column<Tables<"usuarios_app">>[] = [
    { header: "Nombre", cell: (r) => r.nombre },
    {
      header: "Rol",
      cell: (r) => (
        <select
          className="field-input py-1.5 text-xs"
          value={r.rol}
          disabled={savingId === r.id}
          onChange={(e) => cambiarRol(r, e.target.value as UserRole)}
        >
          {ROLES.map((rol) => (
            <option key={rol} value={rol}>
              {rol}
            </option>
          ))}
        </select>
      ),
    },
    { header: "Estado", cell: (r) => <Badge tone={r.activo ? "activo" : "inactivo"}>{r.activo ? "activo" : "inactivo"}</Badge> },
    {
      header: "",
      cell: (r) => (
        <button className="btn-ghost" disabled={savingId === r.id} onClick={() => cambiarActivo(r, !r.activo)}>
          {r.activo ? "Desactivar" : "Activar"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Administración</p>
        <h1 className="text-xl font-semibold text-slate-50">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-400">
          Asigna roles a las cuentas creadas. Las cuentas nuevas quedan como solo-lectura por defecto.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <DataTable columns={columns} rows={rows} keyFn={(r) => r.id} emptyMessage="No hay usuarios registrados." />
      )}
    </div>
  );
}
