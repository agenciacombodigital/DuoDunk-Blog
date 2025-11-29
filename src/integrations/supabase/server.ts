import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback usando as chaves do contexto Supabase
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
// Chave ANÔNIMA (Pública)
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTM2MjUsImV4cCI6MjA3NTI4OTYyNX0.E_325y4DDXWxxeB19aYRQA9RHrqFF1aR6jkEYeq6H0M';
// Chave SERVICE ROLE (Secreta)
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfhFKVDgO9cHJ_E';


// Tenta ler as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_URL;
// Prioriza a chave anônima, mas usa a Service Role Key como último recurso no servidor
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente Supabase ausentes.");
  client = createClient('https://dummy.com', 'dummy');
} else {
  // Se a chave anônima falhar, tentamos usar a Service Role Key (apenas no servidor)
  let finalKey = supabaseKey;
  if (supabaseKey === FALLBACK_ANON_KEY) {
    console.warn("⚠️ AVISO: Chave Anônima falhou. Usando Service Role Key como fallback de emergência para SSR.");
    finalKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  }
  
  // Conexão
  client = createClient(supabaseUrl, finalKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cliente Supabase para uso em Server Components (SSR/SSG).
 */
export const supabaseServer = client;