import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Fallback para o ambiente Dyad/Vercel onde as chaves VITE_ podem não ser injetadas corretamente no cliente.
const FALLBACK_URL = 'https://brerfpcfkyptkzygyzxl.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZXJmcGNma3lwdGt6eWd5enhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMzYyNSwiZXhwIjoyMDc1Mjg5NjI1fQ.PqG2WGGijMVbdI4a8jnk-piyZM8lbfbFKVDgO9cHJ_E';

let adminClient: SupabaseClient;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '⚠️ AVISO: VITE_SUPABASE_SERVICE_ROLE_KEY não configurada via ambiente. Usando fallback para Admin.'
  );
  // Usar chaves de fallback para garantir que o painel Admin funcione no ambiente de desenvolvimento/Dyad
  adminClient = createClient(FALLBACK_URL, FALLBACK_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cliente Supabase Admin com Service Role Key
 * 🔐 TEM PERMISSÕES TOTAIS - Use apenas no servidor ou em contextos seguros!
 */
export const supabaseAdmin = adminClient;

export default supabaseAdmin;