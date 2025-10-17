import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas.");
  // Usamos valores dummy para evitar falha de inicialização do createClient
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'dummy_key';
  
  client = createClient(dummyUrl, dummyKey);
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;