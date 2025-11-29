import { createClient } from '@supabase/supabase-js';

// Fallback usando as chaves do contexto Supabase (seguro para a chave ANÔNIMA)
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTM2MjUsImV4cCI6MjA3NTI4OTYyNX0.E_325y4DDXWxxeB19aYRQA9RHrqFF1aR6jkEYeq6H0M';

// Tenta ler as variáveis de ambiente, priorizando NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

let client;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO FATAL: Variáveis de ambiente Supabase ausentes.");
  client = createClient('https://dummy.com', 'dummy');
} else {
  // Conexão - Adicionando opções de auth para desativar persistência
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cliente Supabase para uso em Server Components (SSR/SSG).
 */
export const supabaseServer = client;