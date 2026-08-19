import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Sin perfil no hay rol ni permisos: la cuenta existe pero aún no fue
  // habilitada por un administrador, así que no debe entrar a la aplicación.
  if (!perfil) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-center text-slate-300">
        Tu cuenta aún no tiene un perfil asignado en MDIBUCEO. Contacta a un administrador para que te asigne un rol.
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
