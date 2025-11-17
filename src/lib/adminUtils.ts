import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Desmarca todos os artigos atualmente marcados como destaque (is_featured = true).
 */
export async function clearAllFeaturedArticles() {
  console.log('Desmarcando todos os artigos em destaque...');
  // Usando supabaseAdmin para garantir que a operação funcione, ignorando RLS
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