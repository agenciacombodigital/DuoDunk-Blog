import { supabase as client } from '@/integrations/supabase/client';
import { supabaseServer } from '@/integrations/supabase/server';

// Exporta o cliente Supabase para uso em Client Components
export const supabase = client;

// Exporta o cliente Supabase para uso em Server Components
export const supabaseSSR = supabaseServer;