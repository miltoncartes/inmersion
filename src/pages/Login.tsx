import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";

type Mode = "signin" | "signup" | "recover";

export function Login() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/" replace />;

  function cambiarModo(nuevo: Mode) {
    setMode(nuevo);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(traducirError(error));
        return;
      }

      if (mode === "recover") {
        // Disponible para cualquier usuario activo, sin importar su rol. Se
        // responde siempre lo mismo para no revelar qué correos existen.
        const { data: permitido } = await supabase.rpc("puede_recuperar_password", {
          p_email: email.trim(),
        });
        if (permitido) {
          await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/nueva-password`,
          });
        }
        setInfo(
          "Si el correo corresponde a una cuenta registrada, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
        );
        return;
      }

      // mode === "signup"
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      const { data: estado } = await supabase.rpc("estado_registro_email", {
        p_email: email.trim(),
      });

      if (estado === "no_registrado") {
        setError(
          "Este correo no está registrado como buzo en el sistema. Pide a un administrador o supervisor que te cargue en el mantenedor de buzos con este correo."
        );
        return;
      }
      if (estado === "no_habilitado") {
        setError(
          "Tu ficha de buzo existe pero aún no está habilitada. Un administrador o supervisor debe habilitarte antes de que puedas crear tu cuenta."
        );
        return;
      }

      const { error } = await signUp(email.trim(), password, nombre);
      if (error) setError(traducirError(error));
      else
        setInfo(
          "Cuenta creada correctamente. Si tu proyecto exige confirmación por correo, revisa tu bandeja antes de iniciar sesión."
        );
    } finally {
      setLoading(false);
    }
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
          {mode === "recover" ? (
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-100">Recuperar contraseña</h2>
              <p className="mt-1 text-xs text-slate-400">
                Te enviaremos un enlace al correo registrado en el sistema.
              </p>
            </div>
          ) : (
            <div className="mb-5 flex rounded-full border border-navy-700 p-1 text-sm">
              <button
                className={`flex-1 rounded-full py-1.5 transition ${mode === "signin" ? "bg-coral-500 text-navy-950 font-semibold" : "text-slate-300"}`}
                onClick={() => cambiarModo("signin")}
                type="button"
              >
                Ingresar
              </button>
              <button
                className={`flex-1 rounded-full py-1.5 transition ${mode === "signup" ? "bg-coral-500 text-navy-950 font-semibold" : "text-slate-300"}`}
                onClick={() => cambiarModo("signup")}
                type="button"
              >
                Crear cuenta
              </button>
            </div>
          )}

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
            {mode !== "recover" && (
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
            )}

            {error && <p className="field-error">{error}</p>}
            {info && <p className="text-xs text-emerald-400">{info}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? "Un momento…"
                : mode === "signin"
                  ? "Ingresar"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : "Enviar enlace"}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === "recover" ? (
              <button type="button" className="btn-ghost" onClick={() => cambiarModo("signin")}>
                ← Volver a ingresar
              </button>
            ) : (
              <button type="button" className="btn-ghost" onClick={() => cambiarModo("recover")}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        </div>

        {mode === "signup" && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Solo los buzos cargados y habilitados en el mantenedor pueden crear una cuenta, usando el correo registrado
            por el administrador.
          </p>
        )}
      </div>
    </div>
  );
}

function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered") || msg.includes("already been registered"))
    return "Ese correo ya tiene una cuenta. Usa la opción Ingresar.";
  if (msg.includes("Password should be")) return "La contraseña es muy débil.";
  if (msg.includes("Email not confirmed"))
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
  if (msg.includes("Database error saving new user"))
    return "No se pudo crear la cuenta: tu correo no está habilitado en el mantenedor de buzos.";
  if (msg.includes("rate limit") || msg.includes("Too many"))
    return "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.";
  return msg;
}
