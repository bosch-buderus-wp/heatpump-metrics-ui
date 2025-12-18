/// <reference types="vite/client" />

interface Window {
  HEAT_PUMP_METRICS_EMBEDDED?: boolean;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_AUTH_METHOD?: "magic-link" | "password";
  VITE_AUTH_CALLBACK_URL?: string;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AUTH_METHOD: "magic-link" | "password";
  readonly VITE_AUTH_CALLBACK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
