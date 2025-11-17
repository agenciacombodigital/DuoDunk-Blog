import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let adminClient: SupabaseClient;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    '⚠️ ERRO: VITE_SUPABASE_SERVICE_ROLE_KEY não configurada. Funções Admin (como exclusão) podem falhar no cliente.'
  );
  // Retorna um cliente dummy para evitar o crash da aplicação no navegador.
  adminClient = createClient('https://dummy.supabase.co', 'dummy_key');
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
 * ⚠️ NUNCA exponha a Service Role Key no código do cliente em produção!
 */
export const supabaseAdmin = adminClient;

export default supabaseAdmin;