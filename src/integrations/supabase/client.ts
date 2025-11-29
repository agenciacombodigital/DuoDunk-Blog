import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback usando as chaves do contexto Supabase (seguro para a chave ANÔNIMA)
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTM2MjUsImV4cCI6MjA3NTI4OTYyNX0.E_325y4DDXWxxeB19aYRQA9RHrqFF1aR6jkEYeq6H0M';

// Variáveis de ambiente do Next.js (devem ser prefixadas com NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient;

const finalUrl = supabaseUrl || FALLBACK_URL;
const finalAnonKey = supabaseAnonKey || FALLBACK_ANON_KEY;

if (!finalUrl || !finalAnonKey) {
  console.error("As chaves Supabase não estão definidas.");
  // Usamos valores dummy para evitar falha de inicialização do createClient
  client = createClient('https://dummy.supabase.co', 'dummy_key');
} else {
  client = createClient(finalUrl, finalAnonKey);
}

export const supabase = client;