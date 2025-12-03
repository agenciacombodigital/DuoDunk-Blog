import { MetadataRoute } from 'next';
import { supabaseServer } from '@/integrations/supabase/server';

export const revalidate = 3600; // Atualiza o sitemap a cada 1 hora (ISR)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.duodunk.com.br';

  // 1. Páginas Estáticas Principais
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
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Buscar Artigos no Banco (Até 10000 mais recentes)
  try {
    const { data: articles } = await supabaseServer
      .from('articles')
      .select('slug, updated_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(10000);

    if (articles) {
      const articleUrls = articles.map((article) => ({
        url: `${baseUrl}/artigos/${article.slug}`,
        lastModified: new Date(article.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));

      return [...routes, ...articleUrls];
    }
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
  }

  return routes;
}