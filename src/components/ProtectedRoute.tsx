import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, perfil, loading, perfilError, refreshPerfil } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Un error real de red/permisos no es lo mismo que "la cuenta no tiene
  // perfil": no hay que decirle al usuario que contacte a un administrador
  // por algo que puede ser un problema pasajero de conexión.
  if (perfilError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-4 text-center text-slate-300">
        <p>No se pudo cargar tu perfil: {perfilError}</p>
        <button className="btn-secondary" onClick={() => refreshPerfil()}>
          Reintentar
        </button>
      </div>
    );
  }

  // Sin perfil no hay rol ni permisos: la cuenta existe pero aún no fue
  // habilitada por un administrador, así que no debe entrar a la aplicación.
  if (!perfil) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-4 text-center text-slate-300">
        <p>Tu cuenta aún no tiene un perfil asignado en MDIBUCEO. Contacta a un administrador para que te asigne un rol.</p>
        <button className="btn-secondary" onClick={() => refreshPerfil()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!perfil.activo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-center text-slate-300">
        Tu cuenta está desactivada o pendiente de aprobación. Contacta a un administrador de MDIBUCEO.
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGate({
  allow,
  children,
  fallback,
}: {
  allow: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!allow) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
