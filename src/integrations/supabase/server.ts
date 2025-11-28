import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente do servidor (sem NEXT_PUBLIC_)
// Usamos SUPABASE_URL (definida no Vercel) para a URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Usamos NEXT_PUBLIC_SUPABASE_ANON_KEY (definida no Vercel) para a chave anônima
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente Supabase (URL/Anon Key) não estão definidas no servidor.");
  // Usamos valores dummy para evitar falha de inicialização
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'dummy_key';
  
  client = createClient(dummyUrl, dummyKey);
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Cliente Supabase para uso em Server Components (SSR/SSG).
 * Usa a chave ANÔNIMA, mas é executado no servidor.
 */
export const supabaseServer = client;