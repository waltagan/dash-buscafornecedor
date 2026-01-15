/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_SERVICE_ROLE?: string;
  readonly VITE_SERVICE_ROLE?: string;
  readonly VITE_SUPABASE_CONNECTION_STRING?: string;
  // Variáveis sem VITE_ não são expostas pelo Vite, mas incluídas para TypeScript
  readonly SUPABASE_CONNECTION_STRING?: string;
  readonly SERVICE_ROLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

