import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import Groq from "https://deno.land/x/groq@0.5.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY') });

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    );

    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) {
      return new Response(JSON.stringify({ message: 'Nenhum artigo na fila para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updateStatusError } = await supabaseAdmin
      .from('articles_queue')
      .update({ status: 'pending_processing' })
      .eq('id', article.id);

    if (updateStatusError) throw updateStatusError;

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

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

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
      JSON.stringify({ message: `Artigo "${aiResponse.title}" processado com Groq!` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in process-with-ai function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});