import { MetadataRoute } from 'next';
import { supabaseServer } from '@/integrations/supabase/server';

// ✅ TEMPO REAL: 0 significa "sem cache". 
// Sempre que o Google pedir, entregamos a lista mais fresca possível.
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.duodunk.com.br';

  // 1. Páginas Estáticas Principais
  const routes = [
    '',
    '/ultimas',
    '/calendario',
    '/classificacao',
    '/times',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const, // Avisa ao Google que mudamos muito
    priority: route === '' ? 1 : 0.9,
  }));

  // 2. Buscar Artigos no Banco (Tempo Real)
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
        priority: 0.8, // Prioridade alta para notícias
      }));

      return [...routes, ...articleUrls];
    }
  } catch (error) {
    console.error('Erro sitemap:', error);
  }

  return routes;
}