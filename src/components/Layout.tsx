import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Resumen", icon: IconGauge, end: true },
  { to: "/inmersiones", label: "Inmersiones", icon: IconAnchor, end: false },
  { to: "/inmersiones/nueva", label: "Nueva inmersión", icon: IconPlus, end: true },
];

const mantenedores = [
  { to: "/mantenedores/buzos", label: "Buzos" },
  { to: "/mantenedores/equipos", label: "Equipos" },
  { to: "/mantenedores/mascaras", label: "Máscaras" },
  { to: "/mantenedores/botellas-aux", label: "Botellas aux." },
  { to: "/mantenedores/botellas-emer", label: "Botellas emer." },
  { to: "/mantenedores/supervisores", label: "Supervisores" },
  { to: "/mantenedores/clientes", label: "Clientes" },
  { to: "/mantenedores/tabla-us-navy", label: "Tabla US Navy" },
];

export function Layout() {
  const { perfil, esAdmin, esBuzo, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950 md:flex">
      <aside className="hidden w-64 shrink-0 border-r border-navy-800 bg-navy-900/40 md:flex md:flex-col">
        <SidebarContent
          esAdmin={esAdmin}
          esBuzo={esBuzo}
          nombre={perfil?.nombre}
          rol={perfil?.rol}
          onSignOut={signOut}
        />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-navy-800 bg-navy-900 shadow-xl">
            <SidebarContent
              esAdmin={esAdmin}
              esBuzo={esBuzo}
              nombre={perfil?.nombre}
              rol={perfil?.rol}
              onSignOut={signOut}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-navy-800 bg-navy-900/60 px-4 py-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-300 hover:bg-navy-800"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <Logo size={32} />
          <span className="font-mono text-xs uppercase tracking-widest text-amber-400">MDIBUCEO</span>
          <div className="ml-auto min-w-0 text-right">
            <p className="truncate text-sm font-medium text-slate-200">{perfil?.nombre ?? "Usuario"}</p>
            <p className="eyebrow leading-tight">{perfil?.rol ?? "—"}</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  esAdmin,
  esBuzo,
  nombre,
  rol,
  onSignOut,
  onNavigate,
}: {
  esAdmin: boolean;
  esBuzo: boolean;
  nombre?: string;
  rol?: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <div>
          <p className="text-sm font-semibold text-slate-50 leading-tight">MDIBUCEO</p>
          <p className="eyebrow leading-tight">Puerto Varas</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="eyebrow mb-1 px-2">Bitácora</p>
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        {!esBuzo && (
          <>
            <p className="eyebrow mb-1 mt-5 px-2">Mantenedores</p>
            {mantenedores.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={IconFolder} end onNavigate={onNavigate} />
            ))}
          </>
        )}

        {esAdmin && (
          <>
            <p className="eyebrow mb-1 mt-5 px-2">Administración</p>
            <NavItem to="/usuarios" label="Usuarios" icon={IconUsers} end onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <div className="border-t border-navy-800 pt-4">
        <p className="truncate text-sm font-medium text-slate-200">{nombre ?? "Usuario"}</p>
        <p className="eyebrow">{rol ?? "—"}</p>
        <button onClick={onSignOut} className="btn-secondary mt-3 w-full">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  end: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-coral-500 text-navy-950"
            : "text-slate-300 hover:bg-navy-800"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

function IconGauge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 19a8 8 0 1116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12l3-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconAnchor({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v14M12 12H7m5 0h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 15c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7a1 1 0 011-1h4l2 2h8a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 8a3 3 0 010 6M19 20c0-2.5-1.6-4.6-4-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
