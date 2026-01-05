import { supabaseServer } from '@/integrations/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Escapa caracteres especiais para garantir validade do XML
 */
function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

export async function GET() {
  const siteUrl = 'https://www.duodunk.com.br';
  
  // 1. Calcular timestamp de 48h atrás (Regra do Google News)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // 2. Buscar artigos publicados nas últimas 48h
  const { data: articles, error } = await supabaseServer
    .from('articles')
    .select('slug, title, published_at')
    .eq('published', true)
    .gt('published_at', twoDaysAgo)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('[Google News Sitemap] Erro ao buscar artigos:', error);
  }

  // 3. Gerar o XML estrito
  const urlset = articles?.map((article) => `
  <url>
    <loc>${siteUrl}/artigos/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>DuoDunk</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${new Date(article.published_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`).join('') || '';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${urlset.trim()}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
      'X-Robots-Tag': 'noindex', // O sitemap em si não deve ser indexado, apenas lido
    },
  });
}