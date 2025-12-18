import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.__SUPABASE_URL__;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Public data may not load until configured.",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
