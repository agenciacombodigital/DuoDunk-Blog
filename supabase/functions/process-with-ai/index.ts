import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("--- PROCESSAMENTO COM GOOGLE GEMINI ---");

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    // Lógica original: busca o próximo artigo pendente na fila
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .or('status.eq.pending,status.is.null,status.eq.')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) {
      console.log("Nenhum artigo encontrado na fila para processar.");
      return new Response(JSON.stringify({ message: 'Nenhum artigo na fila para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processando: ${article.original_title}`);

    await supabaseAdmin
      .from('articles_queue')
      .update({ status: 'pending_processing' })
      .eq('id', article.id);

    const prompt = `Você é um jornalista esportivo especialista em NBA.
    Analise o seguinte título e resumo de uma notícia e gere um artigo completo e detalhado, com pelo menos 5 parágrafos.
    O artigo deve ser envolvente, informativo e otimizado para SEO.
    Inclua tags relevantes para o artigo.
    Crie um slug amigável para URL.

    Título Original: "${article.original_title}"
    Resumo Original: "${article.summary}"

    Responda APENAS com um objeto JSON no seguinte formato, sem nenhum texto adicional:
    {
      "title": "Seu novo título criativo aqui.",
      "summary": "Seu novo resumo de uma frase aqui.",
      "body": "<p>Parágrafo 1 do artigo em HTML.</p><p>Parágrafo 2 do artigo.</p>",
      "meta_description": "Sua meta description para SEO aqui.",
      "tags": ["tag1", "tag2", "tag3"],
      "slug": "seu-novo-slug-baseado-no-titulo"
    }`;

    const modelToUse = 'gemini-1.5-flash-latest';
    console.log(`Chamando Gemini 1.5 Flash (JSON mode otimizado)...`);

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error("Erro da API Gemini:", errorBody);
      await supabaseAdmin.from('articles_queue').update({ status: 'failed' }).eq('id', article.id);
      throw new Error(`A chamada à API Gemini falhou com status ${geminiResponse.status}`);
    }

    const completion = await geminiResponse.json();
    
    const rawText = completion.candidates[0].content.parts[0].text;
    const aiResponse = JSON.parse(rawText);
    
    console.log(`Artigo gerado: ${aiResponse.title}`);

    if (!aiResponse.slug && aiResponse.title) {
      aiResponse.slug = aiResponse.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
    } else if (!aiResponse.slug) {
      aiResponse.slug = `artigo-${article.id}`;
    }

    const { error: updateError } = await supabaseAdmin
      .from('articles_queue')
      .update({
        title: aiResponse.title,
        summary: aiResponse.summary,
        body: aiResponse.body,
        image_url: article.image_url,
        slug: aiResponse.slug,
        tags: aiResponse.tags || ['nba', 'basquete'],
        meta_description: aiResponse.meta_description,
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (updateError) throw updateError;

    console.log("Processado e salvo");
    return new Response(
      JSON.stringify({ message: `Artigo "${aiResponse.title}" processado com sucesso!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("--- ERRO na função process-with-ai ---");
    console.error("Mensagem de erro:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});