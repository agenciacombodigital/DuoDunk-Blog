import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No Next.js, chaves privadas não devem ter NEXT_PUBLIC_.
// Usamos o nome limpo para o ambiente de produção/servidor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave privada

// Fallback para o ambiente Dyad/Vercel onde as chaves VITE_ podem não ser injetadas corretamente no cliente.
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfbFKVDgO9cHJ_E';

let adminClient: SupabaseClient;

// Prioriza a chave privada do Next.js, mas usa o fallback se não estiver definida
const finalServiceKey = supabaseServiceRoleKey || FALLBACK_SERVICE_ROLE_KEY;
const finalUrl = supabaseUrl || FALLBACK_URL;

if (!finalServiceKey) {
  console.warn(
    '⚠️ AVISO: SUPABASE_SERVICE_ROLE_KEY não configurada. Usando fallback para Admin.'
  );
}

adminClient = createClient(finalUrl, finalServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Cliente Supabase Admin com Service Role Key
 * 🔐 TEM PERMISSÕES TOTAIS - Use apenas no servidor ou em contextos seguros!
 */
export const supabaseAdmin = adminClient;

export default supabaseAdmin;