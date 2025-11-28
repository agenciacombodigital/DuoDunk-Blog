"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRateLimitStats as getRateLimitStatsClient } from '@/lib/retryRateLimitedArticles';

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
 * Obtém estatísticas de artigos com rate limit.
 * Esta função pode usar o cliente normal, mas a mantemos aqui para consistência.
 */
export async function getRateLimitStatsServer() {
  // Reutilizamos a lógica do cliente, mas garantimos que o módulo não quebre
  // Se a lógica de retryRateLimitedArticles for movida para o servidor, ela deve ser atualizada.
  // Por enquanto, vamos apenas chamar a função existente que usa o cliente normal.
  return getRateLimitStatsClient();
}

// Nota: A função retryRateLimitedArticles usa o cliente normal (supabase) e não o admin,
// então ela pode permanecer em src/lib/retryRateLimitedArticles.ts.
// No entanto, se ela for chamada de um Server Component, ela deve ser marcada como 'use server'.