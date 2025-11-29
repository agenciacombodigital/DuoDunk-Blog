import { createClient } from '@supabase/supabase-js';

// Tenta ler as variáveis
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("--- DEBUG SUPABASE SERVER ---");
console.log("URL Encontrada:", supabaseUrl ? "SIM" : "NÃO");
console.log("Key Encontrada:", supabaseAnonKey ? "SIM (Tam: " + supabaseAnonKey.length + ")" : "NÃO");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente ausentes.");
  // Cliente Dummy para não crashar o build, mas vai dar erro ao usar
  export const supabaseServer = createClient('https://dummy.com', 'dummy');
} else {
  // Cliente Real
  export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
}