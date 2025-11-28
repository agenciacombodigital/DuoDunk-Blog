import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Usamos as variáveis NEXT_PUBLIC_ que são garantidas de serem injetadas pelo Next.js/Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas no servidor.");
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