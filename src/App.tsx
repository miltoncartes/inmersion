import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute, RoleGate } from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { NuevaPassword } from "./pages/NuevaPassword";
import { Dashboard } from "./pages/Dashboard";
import { Inmersiones } from "./pages/Inmersiones";
import { NuevaInmersion } from "./pages/NuevaInmersion";
import { DetalleInmersion } from "./pages/DetalleInmersion";
import { Usuarios } from "./pages/Usuarios";
import { Buzos } from "./pages/mantenedores/Buzos";
import { Equipos } from "./pages/mantenedores/Equipos";
import { Supervisores } from "./pages/mantenedores/Supervisores";
import { Clientes } from "./pages/mantenedores/Clientes";
import { Mascaras } from "./pages/mantenedores/Mascaras";
import { BotellasAux } from "./pages/mantenedores/BotellasAux";
import { BotellasEmer } from "./pages/mantenedores/BotellasEmer";
import { TablaUsNavy } from "./pages/mantenedores/TablaUsNavy";

export default function App() {
  return (
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
