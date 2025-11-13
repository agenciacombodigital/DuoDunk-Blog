import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { parse } from 'https://esm.sh/gray-matter@4.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper para converter Markdown para HTML (simples, apenas para parágrafos)
function markdownToHtml(markdown: string): string {
  // Substitui quebras de linha duplas por parágrafos HTML
  const paragraphs = markdown.split('\n\n').map(p => {
    if (p.startsWith('#')) return p; // Ignora títulos
    if (p.startsWith('|')) return p; // Ignora tabelas
    return `<p>${p.trim()}</p>`;
  }).join('');
  
  // Nota: Para conversão completa de Markdown para HTML, seria necessário uma biblioteca como 'marked' ou 'markdown-it'.
  // Por enquanto, vamos confiar que o script de resultados gera HTML/Markdown simples.
  return paragraphs;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ⚠️ Segurança: Usar Service Role Key para escrita no banco
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { markdownContent } = await req.json();
    
    if (!markdownContent) {
      return new Response(JSON.stringify({ error: 'Conteúdo Markdown ausente.' }), {
        headers: { ...corsHeaders }, status: 400
      });
    }

    // 1. Parsear Frontmatter e Body
    const { data: frontmatter, content: markdownBody } = parse(markdownContent);
    
    // 2. Converter Markdown Body para HTML (simples)
    // Nota: O script gerarPostsResultados.js já gera um corpo que é quase HTML/Markdown simples.
    // Vamos usar o corpo como está, mas garantir que o slug e o título existem.
    
    const title = frontmatter.title || 'Resultado da Rodada';
    const slug = frontmatter.slug || 'resultado-sem-slug';
    const summary = frontmatter.summary || title;
    const body = markdownBody; // Mantemos o corpo Markdown/HTML gerado pelo script
    const publishedAt = frontmatter.publishedat || new Date().toISOString();
    const tags = frontmatter.tags || ['nba', 'resultados'];
    const imageUrl = frontmatter.imageurl || 'https://cdn.nba.com/logos/nba/nba-logoman-75-word_white.svg';
    
    // 3. Verificar se o post já existe (evitar duplicidade)
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingPost && existingPost.length > 0) {
      return new Response(JSON.stringify({ message: `Post com slug ${slug} já existe. Ignorando.` }), {
        headers: { ...corsHeaders }, status: 200
      });
    }

    // 4. Inserir no banco de dados
    const { error: insertError } = await supabaseAdmin
      .from('articles')
      .insert({
        title,
        slug,
        summary,
        body,
        image_url: imageUrl,
        meta_description: summary,
        tags,
        source: 'Auto-Gerado (Rodada NBA)',
        published: true,
        published_at: publishedAt,
        is_featured: true, // Marcar como destaque para aparecer na Home
        image_focal_point: '50% 50%',
        image_focal_point_mobile: '50%',
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: `Post "${title}" publicado com sucesso!` }), {
      headers: { ...corsHeaders }, status: 200
    });

  } catch (error) {
    console.error('Erro na função publish-markdown-post:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders }, status: 500
    });
  }
});