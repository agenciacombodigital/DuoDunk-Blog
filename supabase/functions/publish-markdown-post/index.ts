import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { parse } from 'https://esm.sh/gray-matter@4.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

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
    
    const title = frontmatter.title || 'Resultado da Rodada';
    const slug = frontmatter.slug || 'resultado-sem-slug';
    const summary = frontmatter.summary || title;
    const body = markdownBody;
    const publishedAt = frontmatter.publishedat || new Date().toISOString();
    const tags = frontmatter.tags || ['nba', 'resultados'];
    const imageUrl = frontmatter.imageurl || 'https://cdn.nba.com/logos/nba/nba-logoman-75-word_white.svg';
    
    // 2. Verificar se o post já existe (evitar duplicidade)
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
    
    // 3. LIMPAR DESTAQUES ANTIGOS (GARANTIR QUE ESTE É O NOVO DESTAQUE)
    console.log('Limpando destaques antigos...');
    const { error: clearError } = await supabaseAdmin
      .from('articles')
      .update({ is_featured: false })
      .eq('is_featured', true);

    if (clearError) {
      console.error('Erro ao limpar destaques antigos:', clearError);
      // Não lançamos erro fatal, apenas logamos, pois a publicação é mais importante
    }

    // 4. Inserir o novo post
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
        is_featured: true, // Marcado como destaque
        image_focal_point: '50% 50%',
        image_focal_point_mobile: '50%',
      });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: `Post "${title}" publicado com sucesso e marcado como destaque!` }), {
      headers: { ...corsHeaders }, status: 200
    });

  } catch (error) {
    console.error('Erro na função publish-markdown-post:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders }, status: 500
    });
  }
});