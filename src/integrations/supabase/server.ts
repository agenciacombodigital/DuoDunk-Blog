import { createClient } from '@supabase/supabase-js';

// Tenta todas as combinações possíveis de variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brerfpcfkyptkzygyzxl.supabase.co';
// ⚠️ Usamos a Service Role Key para acesso irrestrito no servidor (SSR)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfhFKVDgO9cHJ_E';

// Log de Diagnóstico (Aparecerá no terminal)
console.log("--- [Supabase Server Init] ---");
console.log("URL:", supabaseUrl ? "Encontrada" : "NÃO ENCONTRADA");
console.log("Key (Service Role):", supabaseKey ? `Encontrada (${supabaseKey.slice(0, 5)}...)` : "NÃO ENCONTRADA");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO FATAL: Chaves do Supabase ausentes no servidor.");
  // Lançar erro para falhar a build/runtime se a configuração estiver ausente
  throw new Error("Configuração do Supabase Service Role Key ausente. Verifique .env.local ou variáveis de ambiente.");
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Importante para SSR
    autoRefreshToken: false,
  }
});