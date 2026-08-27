import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute, RoleGate } from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";

// Login y Resumen se cargan de inmediato: son la primera pantalla que ve
// cualquiera al entrar. El resto se descarga solo cuando se visita, para que
// un buzo no tenga que bajar el código de los 9 mantenedores que nunca va a
// abrir.
const NuevaPassword = lazy(() => import("./pages/NuevaPassword").then((m) => ({ default: m.NuevaPassword })));
const Inmersiones = lazy(() => import("./pages/Inmersiones").then((m) => ({ default: m.Inmersiones })));
const NuevaInmersion = lazy(() => import("./pages/NuevaInmersion").then((m) => ({ default: m.NuevaInmersion })));
const DetalleInmersion = lazy(() => import("./pages/DetalleInmersion").then((m) => ({ default: m.DetalleInmersion })));
const Usuarios = lazy(() => import("./pages/Usuarios").then((m) => ({ default: m.Usuarios })));
const Buzos = lazy(() => import("./pages/mantenedores/Buzos").then((m) => ({ default: m.Buzos })));
const Equipos = lazy(() => import("./pages/mantenedores/Equipos").then((m) => ({ default: m.Equipos })));
const Supervisores = lazy(() => import("./pages/mantenedores/Supervisores").then((m) => ({ default: m.Supervisores })));
const Clientes = lazy(() => import("./pages/mantenedores/Clientes").then((m) => ({ default: m.Clientes })));
const Mascaras = lazy(() => import("./pages/mantenedores/Mascaras").then((m) => ({ default: m.Mascaras })));
const BotellasAux = lazy(() => import("./pages/mantenedores/BotellasAux").then((m) => ({ default: m.BotellasAux })));
const BotellasEmer = lazy(() => import("./pages/mantenedores/BotellasEmer").then((m) => ({ default: m.BotellasEmer })));
const TablaUsNavy = lazy(() => import("./pages/mantenedores/TablaUsNavy").then((m) => ({ default: m.TablaUsNavy })));

function Cargando() {
  return <p className="text-sm text-slate-400">Cargando…</p>;
}

export default function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/nueva-password" element={<NuevaPassword />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/inmersiones" element={<Inmersiones />} />
          <Route path="/inmersiones/nueva" element={<PuedeRegistrar><NuevaInmersion /></PuedeRegistrar>} />
          <Route path="/inmersiones/:id" element={<DetalleInmersion />} />
          <Route path="/inmersiones/:id/editar" element={<PuedeRegistrar><NuevaInmersion /></PuedeRegistrar>} />
          <Route path="/mantenedores/buzos" element={<EditorOnly><Buzos /></EditorOnly>} />
          <Route path="/mantenedores/equipos" element={<EditorOnly><Equipos /></EditorOnly>} />
          <Route path="/mantenedores/supervisores" element={<EditorOnly><Supervisores /></EditorOnly>} />
          <Route path="/mantenedores/clientes" element={<EditorOnly><Clientes /></EditorOnly>} />
          <Route path="/mantenedores/mascaras" element={<EditorOnly><Mascaras /></EditorOnly>} />
          <Route path="/mantenedores/botellas-aux" element={<EditorOnly><BotellasAux /></EditorOnly>} />
          <Route path="/mantenedores/botellas-emer" element={<EditorOnly><BotellasEmer /></EditorOnly>} />
          <Route path="/mantenedores/tabla-us-navy" element={<EditorOnly><TablaUsNavy /></EditorOnly>} />
          <Route path="/usuarios" element={<AdminOnly><Usuarios /></AdminOnly>} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function PuedeRegistrar({ children }: { children: React.ReactNode }) {
  const { puedeRegistrarInmersion } = useAuth();
  return (
    <RoleGate
      allow={puedeRegistrarInmersion}
      fallback={<p className="text-sm text-slate-400">No tienes permiso para acceder a esta sección.</p>}
    >
      {children}
    </RoleGate>
  );
}

function EditorOnly({ children }: { children: React.ReactNode }) {
  const { esEditor } = useAuth();
  return (
    <RoleGate
      allow={esEditor}
      fallback={<p className="text-sm text-slate-400">No tienes permiso para acceder a esta sección.</p>}
    >
      {children}
    </RoleGate>
  );
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { esAdmin } = useAuth();
  return (
    <RoleGate
      allow={esAdmin}
      fallback={<p className="text-sm text-slate-400">Solo un administrador puede ver esta sección.</p>}
    >
      {children}
    </RoleGate>
  );
}
