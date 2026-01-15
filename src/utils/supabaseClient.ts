import { createClient } from "@supabase/supabase-js";

/**
 * Extrai o project reference de uma connection string do Supabase
 * Formato: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:[PORT]/[DB]
 */
function extractProjectRefFromConnectionString(connectionString: string): string | null {
  try {
    const url = new URL(connectionString.replace(/^postgresql:/, "postgres:"));
    // O project ref está no username, formato: postgres.[PROJECT_REF]
    const username = url.username;
    if (username.startsWith("postgres.")) {
      return username.replace("postgres.", "");
    }
    return null;
  } catch (error) {
    console.error("Erro ao parsear connection string:", error);
    return null;
  }
}

// Configuração do cliente Supabase
// Suporta dois modos:
// 1. Connection String (SUPABASE_CONNECTION_STRING)
// 2. URL + Anon Key (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)

// No Vite, apenas variáveis com prefixo VITE_ são expostas ao cliente
const connectionString = import.meta.env.VITE_SUPABASE_CONNECTION_STRING || import.meta.env.SUPABASE_CONNECTION_STRING || "";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || import.meta.env.VITE_SERVICE_ROLE || "";

let finalSupabaseUrl = supabaseUrl;
// Prioridade: Anon Key > Service Role (anon key é mais seguro para frontend)
let finalSupabaseAnonKey = supabaseAnonKey || supabaseServiceRole;

// Se usar connection string, extrair project ref e construir URL
if (connectionString && !supabaseUrl) {
  const projectRef = extractProjectRefFromConnectionString(connectionString);
  
  if (projectRef) {
    // Construir URL do Supabase a partir do project reference
    finalSupabaseUrl = `https://${projectRef}.supabase.co`;
    console.log(`✅ URL do Supabase construída a partir da connection string: ${finalSupabaseUrl}`);
  } else {
    console.warn("⚠️ Não foi possível extrair o project reference da connection string");
  }
}

// Validação das variáveis de ambiente
if (!finalSupabaseUrl || !finalSupabaseAnonKey) {
  const errorMessage = `
⚠️ ERRO: Variáveis de ambiente do Supabase não configuradas!

Opção 1 - Usando Connection String (recomendado):
  SUPABASE_CONNECTION_STRING=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:[PORT]/[DB]
  VITE_SUPABASE_ANON_KEY=sua_chave_anonima
  # OU
  VITE_SUPABASE_SERVICE_ROLE=sua_service_role_key

Opção 2 - Usando URL e Key:
  VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
  VITE_SUPABASE_ANON_KEY=sua_chave_anonima
  # OU
  VITE_SUPABASE_SERVICE_ROLE=sua_service_role_key

Nota: É necessário pelo menos uma das keys (anon ou service role).
- Anon key (recomendado para frontend): Supabase Dashboard > Settings > API > anon public key
- Service role (use com cuidado, tem permissões elevadas): Supabase Dashboard > Settings > API > service_role key

Após configurar, reinicie o servidor: npm run dev
  `;
  
  console.error(errorMessage);
  throw new Error("Variáveis de ambiente do Supabase não configuradas. Veja o console para mais detalhes.");
}

// Aviso se estiver usando service role (menos seguro para frontend)
if (supabaseServiceRole && !supabaseAnonKey) {
  console.warn(
    "⚠️ ATENÇÃO: Você está usando SERVICE_ROLE key no frontend. " +
    "Isso não é recomendado para produção, pois a service role key tem permissões elevadas. " +
    "Prefira usar VITE_SUPABASE_ANON_KEY para maior segurança."
  );
}

// Criar cliente com schema busca_fornecedor configurado
// Isso permite que todas as queries usem apenas o nome da tabela
export const supabaseClient = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  db: {
    schema: "busca_fornecedor",
  },
});

// Log para debug
console.log("🔧 Cliente Supabase configurado:", {
  url: finalSupabaseUrl,
  hasKey: !!finalSupabaseAnonKey,
  keyLength: finalSupabaseAnonKey?.length || 0,
  schema: "busca_fornecedor",
});
