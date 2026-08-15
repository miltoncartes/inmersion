import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute, RoleGate } from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Inmersiones } from "./pages/Inmersiones";
import { NuevaInmersion } from "./pages/NuevaInmersion";
import { DetalleInmersion } from "./pages/DetalleInmersion";
import { Usuarios } from "./pages/Usuarios";
import { Buzos } from "./pages/mantenedores/Buzos";
import { Equipos } from "./pages/mantenedores/Equipos";
import { Supervisores } from "./pages/mantenedores/Supervisores";
import { Clientes } from "./pages/mantenedores/Clientes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/inmersiones" element={<Inmersiones />} />
        <Route path="/inmersiones/nueva" element={<EditorOnly><NuevaInmersion /></EditorOnly>} />
        <Route path="/inmersiones/:id" element={<DetalleInmersion />} />
        <Route path="/inmersiones/:id/editar" element={<EditorOnly><NuevaInmersion /></EditorOnly>} />
        <Route path="/mantenedores/buzos" element={<Buzos />} />
        <Route path="/mantenedores/equipos" element={<Equipos />} />
        <Route path="/mantenedores/supervisores" element={<Supervisores />} />
        <Route path="/mantenedores/clientes" element={<Clientes />} />
        <Route path="/usuarios" element={<AdminOnly><Usuarios /></AdminOnly>} />
      </Route>
    </Routes>
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
