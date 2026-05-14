import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
const DEFAULT_IMAGE = "https://duodunk.com.br/images/agenda-nba-padrao.jpg";
const BATCH_SIZE = 5;

const getAuthorBySource = (source: string) => {
  const s = (source || '').toLowerCase();
  if (s.includes('cbs')) return 'Hugo Tamura';
  if (s.includes('yahoo')) return 'Maiara Pires';
  return 'Fernando Balley';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY não encontrada.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: articles, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .in('status', ['pending_approval', 'auto_approved'])
      .is('body', null)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError || !articles || articles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Fila vazia.' }), { headers: corsHeaders });
    }

    let processedCount = 0;
    let failedCount = 0;
    let results: any[] = [];

    for (const article of articles) {
      console.log(`[process-with-ai] 📰 Processando: ${article.original_title} (ID: ${article.id})`);
      const fullText = article.original_content || article.full_text || article.content || article.summary;

      if (!fullText || fullText.length < 200) {
        console.warn(`[process-with-ai] ⚠️ Artigo ID ${article.id}: Texto muito curto. Marcando como falha.`);
        await supabaseAdmin.from('articles_queue').update({ status: 'ai_failed', processing_error: 'Texto original muito curto.' }).eq('id', article.id);
        failedCount++;
        results.push({ id: article.id, status: 'failed', error: 'Texto muito curto.' });
        continue;
      }

      const wordCount = fullText.split(/\s+/).length;
      const minWords = Math.floor(wordCount * 0.70);
      const prompt = `Você é um redator brasileiro de esportes do portal DuoDunk. Transforme o texto abaixo em um artigo em português empolgado e natural.
      TEXTO ORIGINAL: """ ${fullText} """
      REGRAS: Use parágrafos curtos, evite travessões, use gírias do esporte, mantenha dados precisos. Mínimo ${minWords} palavras.
      RETORNE APENAS JSON: { "title": "...", "subtitle": "...", "summary": "...", "paragraphs": ["..."], "tags": [], "meta_description": "...", "slug": "..." }`;

      let aiResponse = null;
      let modelUsed = '';
      let processingError: string | null = null;

      for (const model of GEMINI_MODELS) {
        try {
          console.log(`[process-with-ai] 🤖 Artigo ID ${article.id}: Tentando ${model}...`);
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: "application/json" }
            })
          });

          if (!response.ok) {
            const err = await response.text();
            processingError = `Erro API Gemini (${model}): ${err.substring(0, 150)}`;
            continue;
          }

          const json = await response.json();
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            aiResponse = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
            modelUsed = model;
            processingError = null;
            break;
          }
        } catch (e: any) {
          processingError = `Erro inesperado (${model}): ${e.message}`;
        }
      }

      if (!aiResponse) {
        await supabaseAdmin.from('articles_queue').update({ status: 'ai_failed', processing_error: processingError || 'Falha na IA.' }).eq('id', article.id);
        failedCount++;
        results.push({ id: article.id, status: 'failed', error: processingError });
        continue;
      }

      const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('');
      const { error: updateError } = await supabaseAdmin.from('articles_queue').update({
        title: aiResponse.title, subtitle: aiResponse.subtitle, summary: aiResponse.summary,
        body: bodyText, meta_description: aiResponse.meta_description, tags: aiResponse.tags,
        slug: aiResponse.slug, author: getAuthorBySource(article.source), status: 'processed',
        processed_at: new Date().toISOString()
      }).eq('id', article.id);

      if (updateError) {
        failedCount++;
        results.push({ id: article.id, status: 'failed', error: updateError.message });
      } else {
        processedCount++;
        results.push({ id: article.id, status: 'success', model: modelUsed });
      }
    }

    return new Response(JSON.stringify({ success: true, processed_count: processedCount, failed_count: failedCount, results }), { headers: corsHeaders });
  } catch (error: any) {
    console.error('[process-with-ai] ❌ ERRO FATAL:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});