import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL base do seu site
const SITE_URL = 'https://www.duodunk.com.br';

// Páginas estáticas
const staticPages = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/ultimas', changefreq: 'daily', priority: '0.9' },
  { loc: '/times', changefreq: 'weekly', priority: '0.8' },
  { loc: '/classificacao', changefreq: 'daily', priority: '0.9' },
  { loc: '/calendario', changefreq: 'daily', priority: '0.8' },
  { loc: '/resultados-ontem', changefreq: 'daily', priority: '0.8' },
  { loc: '/privacidade', changefreq: 'monthly', priority: '0.5' },
  { loc: '/cookies', changefreq: 'monthly', priority: '0.5' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Usar Service Role Key para ignorar RLS e garantir acesso total aos dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Buscar todos os artigos publicados
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('slug, published_at, updated_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    // 2. Gerar URLs dinâmicas
    const articleUrls = (articles || []).map(article => {
      // Usar updated_at se existir, senão usa published_at
      const lastmod = article.updated_at || article.published_at;
      return {
        loc: `/artigos/${article.slug}`, // Corrigido para usar /artigos/
        lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.7',
      };
    });

    // 3. Combinar estáticas e dinâmicas
    const allUrls = [...staticPages, ...articleUrls];

    // 4. Gerar o XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    allUrls.forEach(url => {
      xml += `
  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        ...corsHeaders,
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to generate sitemap' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});