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
  rol: UserRole | null;
  esEditor: boolean;
  esAdmin: boolean;
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

  async function loadPerfil(userId: string) {
    const { data } = await supabase
      .from("usuarios_app")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
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
        loadPerfil(newSession.user.id);
      } else {
        setPerfil(null);
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

  const value: AuthState = {
    session,
    perfil,
    loading,
    rol,
    esEditor: rol === "admin" || rol === "supervisor",
    esAdmin: rol === "admin",
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
