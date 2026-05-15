import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const BATCH_SIZE = 5; // Publica até 5 artigos por invocação

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Busca artigos da fila que foram processados e estão prontos para publicação
    const { data: articlesToPublish, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .eq('status', 'processed')
      .not('body', 'is', null) // Garante que o corpo do artigo não seja nulo
      .order('processed_at', { ascending: true }) // Publica os mais antigos primeiro
      .limit(BATCH_SIZE);

    if (fetchError || !articlesToPublish || articlesToPublish.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhum artigo pronto para publicação na fila.' }), { headers: corsHeaders });
    }

    let publishedCount = 0;
    let failedCount = 0;
    let results: any[] = [];

    for (const article of articlesToPublish) {
      console.log(`[auto-publish-articles] 🚀 Tentando publicar artigo: ${article.title} (ID na fila: ${article.id})`);

      try {
        // Insere o artigo na tabela principal 'articles'
        const { data: publishedArticle, error: insertError } = await supabaseAdmin
          .from('articles')
          .insert({
            title: article.title,
            subtitle: article.subtitle,
            body: article.body,
            slug: article.slug,
            summary: article.summary,
            image_url: article.image_url,
            image_focal_point: article.image_focal_point || '50% 50%',
            image_focal_point_mobile: article.image_focal_point_mobile || '50%',
            author: article.author,
            source: article.source,
            tags: article.tags,
            published: true,
            is_featured: false,
            video_url: article.video_url || null,
            meta_description: article.meta_description,
            published_at: new Date().toISOString(),
            views: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Atualiza o status do artigo na articles_queue para 'published'
        const { error: updateQueueError } = await supabaseAdmin
          .from('articles_queue')
          .update({ 
            status: 'published', 
            published_at: new Date().toISOString() 
          })
          .eq('id', article.id);

        if (updateQueueError) {
          console.error(`[auto-publish-articles] ⚠️ Artigo ID na fila ${article.id}: Erro ao atualizar status na fila:`, updateQueueError);
        }

        console.log(`[auto-publish-articles] ✅ Artigo "${article.title}" publicado com sucesso!`);
        publishedCount++;
        results.push({ queue_id: article.id, status: 'published', article_id: publishedArticle.id });

      } catch (publishError: any) {
        console.error(`[auto-publish-articles] ❌ Artigo ID na fila ${article.id}: Erro ao publicar:`, publishError);
        await supabaseAdmin
          .from('articles_queue')
          .update({ 
            status: 'ai_failed', 
            processing_error: `Erro ao publicar: ${publishError.message}` 
          })
          .eq('id', article.id);
        failedCount++;
        results.push({ queue_id: article.id, status: 'publish_failed', error: publishError.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      published_count: publishedCount,
      failed_count: failedCount,
      results: results
    }), { headers: corsHeaders });

  } catch (error: any) {
    console.error('[auto-publish-articles] ❌ ERRO FATAL:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});