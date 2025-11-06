import { supabase } from './supabase';

/**
 * Desmarca todos os artigos atualmente marcados como destaque (is_featured = true).
 */
export async function clearAllFeaturedArticles() {
  console.log('Desmarcando todos os artigos em destaque...');
  const { error } = await supabase
    .from('articles')
    .update({ is_featured: false })
    .eq('is_featured', true);

  if (error) {
    console.error('Erro ao desmarcar destaques antigos:', error);
    throw new Error('Falha ao limpar destaques antigos.');
  }
  console.log('Destaques antigos limpos com sucesso.');
}