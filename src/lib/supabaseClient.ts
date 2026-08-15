import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// La anon/publishable key está diseñada para ser pública: la protección real
// de los datos vive en las políticas RLS de Postgres, no en ocultar esta key.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://ozwbhpdulgibbvtzzydl.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "sb_publishable_7pRmUcsISDqelf4Bow96rw_GM5d0jtw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
