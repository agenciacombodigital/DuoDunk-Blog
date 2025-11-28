import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tenta ler as variáveis de ambiente de servidor (sem prefixo) OU as públicas (com NEXT_PUBLIC_)
// Isso garante que funcione tanto localmente quanto na Vercel.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas no servidor.");
  console.error("Verifique: SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL");
  
  // Usamos valores dummy para evitar crash total, mas as queries falharão
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'dummy_key';
  
  client = createClient(dummyUrl, dummyKey);
} else {
  // Conexão bem-sucedida
  client = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Cliente Supabase para uso em Server Components (SSR/SSG).
 */
export const supabaseServer = client;