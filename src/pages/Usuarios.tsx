import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useCrud } from "../lib/useCrud";
import { supabase } from "../lib/supabaseClient";
import { mensajeDeError } from "../lib/errores";
import { DataTable, type Column } from "../components/DataTable";
import { Badge } from "../components/Badge";
import type { Tables, UserRole } from "../lib/types";

const ROLES: UserRole[] = ["admin", "supervisor", "buzo"];

export function Usuarios() {
  const { perfil } = useAuth();
  const { rows, loading, update, reload } = useCrud("usuarios_app", "nombre");
  const [buzos, setBuzos] = useState<Tables<"buzo">[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("buzo")
      .select("*")
      .order("nombre_buzo")
      .then(({ data }) => setBuzos(data ?? []));
  }, []);

  async function cambiarRol(row: Tables<"usuarios_app">, rol: UserRole) {
    setSavingId(row.id);
    await update({ id: row.id }, { rol });
    setSavingId(null);
  }

  async function cambiarBuzo(row: Tables<"usuarios_app">, id_buzo: string) {
    setSavingId(row.id);
    await update({ id: row.id }, { id_buzo: id_buzo || null });
    setSavingId(null);
  }

  async function cambiarActivo(row: Tables<"usuarios_app">, activo: boolean) {
    setSavingId(row.id);
    await update({ id: row.id }, { activo });
    setSavingId(null);
  }

  async function eliminarUsuario(row: Tables<"usuarios_app">) {
    const confirmado = confirm(
      `¿Eliminar la cuenta de ${row.nombre} (rol ${row.rol})?\n\n` +
        `Se borrará su acceso al sistema de forma permanente. Las inmersiones que haya ` +
        `registrado se mantienen, pero dejarán de mostrar quién las creó.\n\n` +
        `Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setSavingId(row.id);
    const { error } = await supabase.rpc("eliminar_usuario", { p_id: row.id });
    setSavingId(null);

    if (error) {
      alert(mensajeDeError(error, "eliminar el usuario"));
      return;
    }
    await reload();
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
    {
      header: "Ficha de buzo",
      cell: (r) =>
        r.rol === "buzo" ? (
          <select
            className="field-input py-1.5 text-xs"
            value={r.id_buzo ?? ""}
            disabled={savingId === r.id}
            onChange={(e) => cambiarBuzo(r, e.target.value)}
          >
            <option value="">Sin ligar</option>
            {buzos.map((b) => (
              <option key={b.id_buzo} value={b.id_buzo}>
                {b.nombre_buzo} · {b.rut_buzo}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
    { header: "Estado", cell: (r) => <Badge tone={r.activo ? "activo" : "inactivo"}>{r.activo ? "activo" : "inactivo"}</Badge> },
    {
      header: "",
      className: "whitespace-nowrap",
      cell: (r) => {
        // Las cuentas de administrador no se eliminan desde aquí: primero hay
        // que cambiarles el rol. Tampoco puedes eliminar tu propia cuenta.
        const puedeEliminar = r.rol !== "admin" && r.id !== perfil?.id;
        return (
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              disabled={savingId === r.id}
              onClick={() => cambiarActivo(r, !r.activo)}
            >
              {r.activo ? "Desactivar" : "Activar"}
            </button>
            {puedeEliminar && (
              <button
                className="btn-ghost text-red-400"
                disabled={savingId === r.id}
                onClick={() => eliminarUsuario(r)}
              >
                Eliminar
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Administración</p>
        <h1 className="text-xl font-semibold text-slate-50">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-400">
          Asigna roles a las cuentas creadas. Las cuentas nuevas quedan como <strong>buzo</strong> por defecto. A un usuario con
          rol buzo hay que ligarle su ficha para que vea sus propias inmersiones.
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
