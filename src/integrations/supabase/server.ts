import { createClient } from '@supabase/supabase-js';

// Função para limpar chaves (tira espaços e aspas extras)
const cleanKey = (key?: string) => key ? key.trim().replace(/^["']|["']$/g, '') : '';

// Tenta todas as combinações possíveis de variáveis de ambiente
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfhFKVDgO9cHJ_E';

// Prioriza variáveis de ambiente do servidor, usando Service Role Key
const supabaseUrl = cleanKey(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL);
const supabaseKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY);

console.log("--- [Supabase Server Connection] ---");
console.log("URL:", supabaseUrl ? "OK" : "VAZIA");
console.log("Key (Service Role):", supabaseKey ? `OK (Inicia com: ${supabaseKey.slice(0, 5)}...)` : "VAZIA");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO FATAL: Supabase URL ou Service Role Key ausentes.");
  throw new Error("Configuração do Supabase Service Role Key ausente. Verifique .env.local ou variáveis de ambiente.");
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Importante para SSR
    autoRefreshToken: false,
  }
});