import { supabase as client } from '@/integrations/supabase/client';

/**
 * Cliente Supabase para uso em Client Components (Browser).
 */
export const supabase = client;

// Removendo a exportação de supabaseSSR daqui para evitar problemas de contexto.
// Server Components devem importar diretamente de '@/integrations/supabase/server'.