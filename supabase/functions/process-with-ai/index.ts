import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const GEMINI_MODELS = ['gemini-2.5-flash']; 
const DEFAULT_IMAGE = "https://duodunk.com.br/images/agenda-nba-padrao.jpg";

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
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .in('status', ['pending_approval', 'auto_approved'])
      .is('body', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) return new Response(JSON.stringify({ success: true, message: 'Fila vazia.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    console.log(`📰 Processando (Modo Tradução Direta): ${article.original_title}`);

    // --- PROMPT SIMPLIFICADO E DIRETO ---
    const prompt = `
    AJA COMO: Jornalista Esportivo do Portal DuoDunk (Especialista em NBA).
    
    TAREFA: Traduzir e adaptar a notícia abaixo para Português do Brasil.
    
    TEXTO ORIGINAL (FONTE):
    """
    ${article.summary}
    """

    DIRETRIZES OBRIGATÓRIAS:
    1. **NÃO INVENTE:** Escreva apenas o que está no texto.
    2. **NÃO OMITE NOMES:** Se o texto fala "Austin Reaves", escreva "Austin Reaves". Se fala "Lakers", escreva "Lakers". JAMAIS use termos genéricos como "um jogador" ou "uma equipe" se o nome estiver disponível.
    3. **MANTENHA OS DADOS:** Copie exatamente as estatísticas (pontos, assistências), prazos de lesão e placares citados.
    4. **ESTILO:** Linguagem fluida de site de notícias esportivas.
    5. **TAMANHO:** Mantenha a profundidade do texto original. Não resuma.

    SAÍDA JSON:
    {
      "title": "Título em PT-BR (Fiel ao original)",
      "subtitle": "Subtítulo informativo",
      "summary": "Resumo curto (Max 140 chars)",
      "paragraphs": [
        "Parágrafo 1...",
        "Parágrafo 2...",
        "Parágrafo 3...",
        "Parágrafo 4..."
      ],
      "tags": ["nba", "time", "jogador", "topico"],
      "meta_description": "SEO Description (150 chars)",
      "slug": "titulo-url-amigavel"
    }
    `;

    let aiResponse = null;
    let modelUsed = '';

    for (const model of GEMINI_MODELS) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1, // Temperatura baixa para fidelidade
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json"
                }
              })
            });

            if (!response.ok) {
                console.error(await response.text());
                continue;
            }

            const json = await response.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
                aiResponse = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
                modelUsed = model;
                break;
            }
        } catch (e) { console.error(e); }
    }

    if (!aiResponse) throw new Error("Falha na IA.");

    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('');
    
    // Tratamento de imagem
    const isOldBrokenPattern = article.image_url && (
        article.image_url.includes('agenda-nba-padrao.jpg') || 
        article.image_url.includes('undefined') ||
        article.image_url.length < 5
    );
    const finalImage = isOldBrokenPattern ? DEFAULT_IMAGE : (article.image_url || DEFAULT_IMAGE);

    const { error: updateError } = await supabaseAdmin
        .from('articles_queue')
        .update({
            title: aiResponse.title,
            subtitle: aiResponse.subtitle,
            summary: aiResponse.summary,
            body: bodyText,
            meta_description: aiResponse.meta_description,
            tags: aiResponse.tags,
            slug: aiResponse.slug,
            image_url: finalImage,
            author: getAuthorBySource(article.source),
            status: 'processed',
            processed_at: new Date().toISOString()
        })
        .eq('id', article.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: `Processado (${modelUsed})` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});