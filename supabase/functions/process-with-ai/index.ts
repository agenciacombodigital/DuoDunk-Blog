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
    console.log("--- Função process-with-ai iniciada (Versão 6 - Busca Flexível) ---");

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY não encontrada nas variáveis de ambiente.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    // MODIFICAÇÃO: Agora busca por status 'pending' OU 'null'
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .or('status.eq.pending,status.is.null')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) {
      console.log("Nenhum artigo encontrado na fila 'pending' ou 'null'.");
      return new Response(JSON.stringify({ message: 'Nenhum artigo na fila para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Artigo encontrado para processar: ${article.id} - "${article.original_title}"`);

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

    const modelToUse = 'llama3-70b-8192';
    console.log(`Chamando a API Groq diretamente com o modelo: ${modelToUse}`);

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.json();
      console.error("Erro da API Groq:", errorBody);
      throw new Error(`A chamada à API Groq falhou com status ${groqResponse.status}`);
    }

    const completion = await groqResponse.json();
    const aiResponse = JSON.parse(completion.choices[0].message.content);
    console.log("Resposta da IA recebida e processada com sucesso.");

    const { error: updateError } = await supabaseAdmin
      .from('articles_queue')
      .update({
        ...aiResponse,
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', article.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: `Artigo "${aiResponse.title}" processado com sucesso!` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("--- ERRO na função process-with-ai (Versão 6 - Busca Flexível) ---");
    console.error("Mensagem de erro:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});