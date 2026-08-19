import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../lib/auth";

export function Login() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(traducirError(error));
    } else {
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, nombre);
      if (error) setError(traducirError(error));
      else setInfo("Cuenta creada. Si tu proyecto exige confirmación por correo, revisa tu bandeja antes de iniciar sesión.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={56} />
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Bitácora de inmersiones</h1>
            <p className="eyebrow mt-1">Registro personal · MDI Buceo</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex rounded-full border border-navy-700 p-1 text-sm">
            <button
              className={`flex-1 rounded-full py-1.5 transition ${mode === "signin" ? "bg-coral-500 text-navy-950 font-semibold" : "text-slate-300"}`}
              onClick={() => setMode("signin")}
              type="button"
            >
              Ingresar
            </button>
            <button
              className={`flex-1 rounded-full py-1.5 transition ${mode === "signup" ? "bg-coral-500 text-navy-950 font-semibold" : "text-slate-300"}`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="field-label">Nombre completo</label>
                <input
                  className="field-input"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Juan Pérez"
                />
              </div>
            )}
            <div>
              <label className="field-label">Correo</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.cl"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {error && <p className="field-error">{error}</p>}
            {info && <p className="text-xs text-emerald-400">{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Un momento…" : mode === "signin" ? "Ingresar" : "Crear cuenta"}
            </button>
          </form>
        </div>

        {mode === "signup" && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Las cuentas nuevas quedan con rol de buzo (registro y consulta de tus propias inmersiones) hasta que un administrador asigne otro rol.
          </p>
        )}
      </div>
    </div>
  );
}

function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered")) return "Ese correo ya tiene una cuenta.";
  if (msg.includes("Password should be")) return "La contraseña es muy débil.";
  return msg;
}
