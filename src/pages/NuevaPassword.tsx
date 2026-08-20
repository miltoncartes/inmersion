import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Footer } from "../components/Footer";
import { supabase } from "../lib/supabaseClient";

/**
 * Pantalla a la que llega el usuario desde el enlace de recuperación enviado
 * por correo. Supabase abre una sesión temporal al validar el enlace, y aquí
 * el usuario define su nueva contraseña.
 */
export function NuevaPassword() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setListo(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setListo(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(
        err.message.includes("same as the old")
          ? "La nueva contraseña debe ser distinta a la anterior."
          : `No se pudo actualizar la contraseña: ${err.message}`
      );
      return;
    }

    setOk(true);
    setTimeout(() => navigate("/"), 1200);
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo size={56} />
          <div>
            <h1 className="text-xl font-semibold text-slate-50">Nueva contraseña</h1>
            <p className="eyebrow mt-1">MDIBUCEO</p>
          </div>
        </div>

        <div className="card p-6">
          {!listo ? (
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Este enlace no es válido o ya expiró. Vuelve a la pantalla de ingreso y solicita un nuevo enlace de
                recuperación.
              </p>
              <button className="btn-secondary w-full" onClick={() => navigate("/login")}>
                Volver a ingresar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Nueva contraseña</label>
                <input
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="field-label">Repetir contraseña</label>
                <input
                  type="password"
                  className="field-input"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="field-error">{error}</p>}
              {ok && <p className="text-xs text-emerald-400">Contraseña actualizada. Entrando…</p>}

              <button type="submit" disabled={loading || ok} className="btn-primary w-full">
                {loading ? "Guardando…" : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
