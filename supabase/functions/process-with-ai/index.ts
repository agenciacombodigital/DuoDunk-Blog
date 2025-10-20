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
    console.log("--- Função process-with-ai iniciada (Modelo Groq Atualizado) ---");

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY não encontrada nas variáveis de ambiente.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    console.log("Buscando artigos na fila (status 'pending', 'null' ou '')...");
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .or('status.eq.pending,status.is.null,status.eq.') // Busca por status 'pending', 'null' OU string vazia ('')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) {
      console.log("Nenhum artigo encontrado na fila para processar.");
      return new Response(JSON.stringify({ message: 'Nenhum artigo na fila para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Artigo encontrado para processar: ${article.id} - "${article.original_title}"`);

    // 1. VERIFICAÇÃO DE DUPLICIDADE (title_hash)
    if (article.title_hash) {
      const { data: existingArticle, error: checkError } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('title_hash', article.title_hash)
        .limit(1)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No rows found
        throw checkError;
      }

      if (existingArticle) {
        console.log(`Artigo duplicado encontrado (hash: ${article.title_hash}). Removendo da fila.`);
        await supabaseAdmin.from('articles_queue').delete().eq('id', article.id);
        return new Response(JSON.stringify({ message: `Artigo duplicado (hash: ${article.title_hash}) foi removido da fila.` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    await supabaseAdmin
      .from('articles_queue')
      .update({ status: 'pending_processing' }) // Marcar como em processamento
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

    const modelToUse = 'llama3-8b-8192'; // Modelo Groq ATUALIZADO E ATIVO
    console.log(`Chamando a API Groq com o modelo: ${modelToUse}`);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }, // Pedindo JSON diretamente
      })
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.json();
      console.error("Erro da API Groq:", errorBody);
      await supabaseAdmin.from('articles_queue').update({ status: 'failed' }).eq('id', article.id);
      throw new Error(`A chamada à API Groq falhou com status ${groqResponse.status}`);
    }

    const completion = await groqResponse.json();
    const aiResponse = JSON.parse(completion.choices[0].message.content);
    console.log("Resposta da IA recebida e processada com sucesso.");

    // Gerar slug se não veio
    if (!aiResponse.slug && aiResponse.title) {
      aiResponse.slug = aiResponse.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
    } else if (!aiResponse.slug) {
      aiResponse.slug = `artigo-${article.id}`; // Fallback slug
    }

    const { error: updateError } = await supabaseAdmin
      .from('articles_queue')
      .update({
        title: aiResponse.title,
        summary: aiResponse.summary,
        body: aiResponse.body,
        image_url: article.image_url, // Manter a imagem original
        slug: aiResponse.slug,
        tags: aiResponse.tags || ['nba', 'basquete'], // Fallback para tags
        meta_description: aiResponse.meta_description,
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (updateError) throw updateError;

    console.log("--- Artigo processado com sucesso! ---");
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