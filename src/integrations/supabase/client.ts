import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas.");
  // Em vez de lançar um erro fatal, retornamos um cliente que não fará nada.
  // Isso permite que o app renderize, mas as chamadas ao DB falharão.
  // O usuário deve configurar as variáveis na Vercel.
  // Usamos valores dummy para evitar falha de inicialização do createClient
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'dummy_key';
  
  export const supabase = createClient(dummyUrl, dummyKey);
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}