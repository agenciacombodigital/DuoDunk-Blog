"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Desmarca todos os artigos atualmente marcados como destaque (is_featured = true).
 */
export async function clearAllFeaturedArticlesServer() {
  console.log('Desmarcando todos os artigos em destaque (Server Action)...');
  const { error } = await supabaseAdmin
    .from('articles')
    .update({ is_featured: false })
    .eq('is_featured', true);

  if (error) {
    console.error('Erro ao desmarcar destaques antigos:', error);
    throw new Error('Falha ao limpar destaques antigos.');
  }
  console.log('Destaques antigos limpos com sucesso.');
}

/**
 * Obtém estatísticas de artigos com rate limit usando o cliente Admin.
 */
export async function getRateLimitStatsServer() {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles_queue')
      .select('id, retry_after')
      .eq('status', 'rate_limited');

    if (error) throw error;

    const now = new Date();
    const ready = data?.filter(a => new Date(a.retry_after) <= now).length || 0;
    const waiting = data?.filter(a => new Date(a.retry_after) > now).length || 0;

    return {
      success: true,
      total: data?.length || 0,
      ready_to_retry: ready,
      still_waiting: waiting
    };
  } catch (error: any) {
    console.error('❌ Erro ao buscar stats (Server):', error.message);
    return { success: false, error: error.message };
  }
}