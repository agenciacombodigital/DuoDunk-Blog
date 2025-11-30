import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback usando as chaves do contexto Supabase
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
// Chave SERVICE ROLE (Secreta) - Usada para garantir acesso no SSR
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfhFKVDgO9cHJ_E';


// Tenta ler as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_URL;
// Usar Service Role Key para o cliente de servidor
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente Supabase ausentes.");
  client = createClient('https://dummy.com', 'dummy');
} else {
  // Conexão
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cliente Supabase para uso em Server Components (SSR/SSG).
 * Usa Service Role Key para garantir acesso irrestrito no servidor.
 */
export const supabaseServer = client;