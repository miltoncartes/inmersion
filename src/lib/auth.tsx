import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Tables, UserRole } from "./types";

type Perfil = Tables<"usuarios_app">;

type AuthState = {
  session: Session | null;
  perfil: Perfil | null;
  loading: boolean;
  /** Se pobló si la última consulta del perfil falló por un error real
   * (red, permisos), a diferencia de que el perfil simplemente no exista. */
  perfilError: string | null;
  rol: UserRole | null;
  esEditor: boolean;
  esAdmin: boolean;
  esBuzo: boolean;
  idBuzo: string | null;
  puedeRegistrarInmersion: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfilError, setPerfilError] = useState<string | null>(null);

  async function loadPerfil(userId: string) {
    const { data, error } = await supabase
      .from("usuarios_app")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // Un error real (red, permisos) no es lo mismo que "no tiene perfil":
      // no lo tratamos como si la cuenta no existiera.
      setPerfilError(error.message);
      return;
    }
    setPerfilError(null);
    setPerfil(data ?? null);
  }

  async function refreshPerfil() {
    if (session?.user) await loadPerfil(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadPerfil(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Se mantiene loading=true mientras se trae el perfil recién logueado:
        // sin esto, la pantalla alcanza a mostrar "sin perfil" por una
        // fracción de segundo en cada inicio de sesión, antes de que llegue
        // la respuesta real.
        setLoading(true);
        loadPerfil(newSession.user.id).finally(() => setLoading(false));
      } else {
        setPerfil(null);
        setPerfilError(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, nombre: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const rol = perfil?.rol ?? null;
  const esEditor = rol === "admin" || rol === "supervisor";
  const esBuzo = rol === "buzo";

  const value: AuthState = {
    session,
    perfil,
    loading,
    perfilError,
    rol,
    esEditor,
    esAdmin: rol === "admin",
    esBuzo,
    idBuzo: perfil?.id_buzo ?? null,
    puedeRegistrarInmersion: esEditor || esBuzo,
    signIn,
    signUp,
    signOut,
    refreshPerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
