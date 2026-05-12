import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback usando as chaves do contexto Supabase
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTM2MjUsImV4cCI6MjA3NTI4OTYyNX0.E_325y4DDXWxxeB19aYRQA9RHrqFF1aR6jkEYeq6H0M';

// Variáveis de ambiente do Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ LIMPEZA: Garante que não existam aspas extras (comum em alguns ambientes de deploy)
const finalUrl = (supabaseUrl || FALLBACK_URL).replace(/["']/g, "").trim();
const finalAnonKey = (supabaseAnonKey || FALLBACK_ANON_KEY).replace(/["']/g, "").trim();

let client: SupabaseClient;

try {
  client = createClient(finalUrl, finalAnonKey);
} catch (error) {
  console.error("Erro ao inicializar cliente Supabase:", error);
  // Fallback para evitar erro de runtime fatal
  client = createClient('https://dummy.supabase.co', 'dummy_key');
}

export const supabase = client;