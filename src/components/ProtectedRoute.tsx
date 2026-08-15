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

  if (perfil && !perfil.activo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-center text-slate-300">
        Tu cuenta está desactivada. Contacta a un administrador de MDIBUCEO.
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
