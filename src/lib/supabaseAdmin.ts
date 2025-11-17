import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    '⚠️ ERRO: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY não configuradas!'
  );
}

/**
 * Cliente Supabase Admin com Service Role Key
 * 🔐 TEM PERMISSÕES TOTAIS - Use apenas no servidor ou em contextos seguros!
 * ⚠️ NUNCA exponha a Service Role Key no código do cliente em produção!
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;