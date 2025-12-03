import { MetadataRoute } from 'next';
import { supabaseServer } from '@/integrations/supabase/server';

// ✅ TEMPO REAL (ZERO CACHE)
// Isso garante que o sitemap seja gerado na hora que o Googlebot acessa,
// incluindo a notícia que você acabou de publicar há 1 segundo.
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.duodunk.com.br';

  // 1. Páginas Estáticas Principais (Prioridade Máxima)
  const routes = [
    '',
    '/ultimas',
    '/calendario',
    '/classificacao',
    '/times',
    '/privacidade',
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const, // Indica alta frequência de atualização
    priority: route === '' ? 1 : 0.9,
  }));

  // 2. Buscar Artigos no Banco (Até 10.000 mais recentes)
  try {
    const { data: articles } = await supabaseServer
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(10000);

    if (articles) {
      const articleUrls = articles.map((article) => ({
        url: `${baseUrl}/artigos/${article.slug}`,
        lastModified: new Date(article.updated_at || article.published_at),
        changeFrequency: 'daily' as const,
        priority: 0.8, // Prioridade alta para conteúdo de notícias
      }));

      return [...routes, ...articleUrls];
    }
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
  }

  // Se o banco falhar, retorna pelo menos as páginas estáticas
  return routes;
}