import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No ambiente de execução do servidor (Server Components), as variáveis sem prefixo
// (SUPABASE_URL e SUPABASE_ANON_KEY) são as que estão disponíveis.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão definidas no servidor.");
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