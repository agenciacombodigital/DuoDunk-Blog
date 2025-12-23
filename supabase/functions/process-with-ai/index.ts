import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
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
    console.log('🚀 [AI] Iniciando processamento (Modo Fidelidade de Dados)...');

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

    console.log(`📰 Processando: ${article.original_title}`);

    // --- PROMPT DE ALTA FIDELIDADE ---
    const prompt = `
    ATUE COMO: Tradutor Técnico Esportivo da NBA (Foco em Precisão de Dados).
    
    FONTE: ${article.source}
    TITULO ORIGINAL: ${article.original_title}
    CONTEÚDO ORIGINAL: 
    """
    ${article.summary}
    """

    OBJETIVO: Traduzir e adaptar a notícia para PT-BR, mantendo TODOS os dados estatísticos e fatos históricos do original.

    DIRETRIZES DE FIDELIDADE (CRÍTICO):
    1.  **NÃO RESUMA OS NÚMEROS.** Se o texto diz "100th game in 29 games", você DEVE escrever "100º jogo em apenas 29 partidas".
    2.  **CONTEXTO HISTÓRICO:** Se o texto cita recordes anteriores (ex: "beat Stephen Curry's record"), ISSO É OBRIGATÓRIO no texto final.
    3.  **BOX SCORE:** Se houver estatísticas do jogo (pontos, rebotes, placar final), elas DEVEM aparecer no parágrafo de desenvolvimento.
    4.  **QUEM DISSE O QUÊ:** Mantenha as citações (aspas) dos jogadores/treinadores traduzidas fielmente.

    ESTRUTURA DO TEXTO:
    - **P1 (O Feito):** O que aconteceu de histórico ou relevante? (Use os números aqui).
    - **P2 (O Jogo/Estatísticas):** Como foi a partida? Placar, atuação individual, números específicos.
    - **P3 (O Contexto):** Comparação com recordes anteriores, falas de técnicos ou curiosidades citadas.
    - **P4 (O Futuro):** Próximos jogos ou impacto na temporada.

    SAÍDA JSON (MANTENHA ESTE FORMATO):
    {
      "title": "Título Jornalístico com Gatilho e Nome do Jogador (PT-BR)",
      "subtitle": "Subtítulo com o dado estatístico principal",
      "summary": "Resumo para card (Max 140 chars)",
      "paragraphs": [
        "Texto do parágrafo 1...",
        "Texto do parágrafo 2...",
        "Texto do parágrafo 3...",
        "Texto do parágrafo 4..."
      ],
      "tags": ["nba", "time", "jogador", "recorde"],
      "meta_description": "Resumo SEO com palavras-chave e números (150 chars)",
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
                  temperature: 0.2, // Temperatura baixa para máxima fidelidade aos dados
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json"
                }
              })
            });

            if (!response.ok) continue;
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
    const finalSlug = aiResponse.slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const finalImage = article.image_url || DEFAULT_IMAGE;
    const authorName = getAuthorBySource(article.source);

    const { error: updateError } = await supabaseAdmin
        .from('articles_queue')
        .update({
            title: aiResponse.title,
            subtitle: aiResponse.subtitle,
            summary: aiResponse.summary,
            body: bodyText,
            meta_description: aiResponse.meta_description,
            tags: aiResponse.tags,
            slug: finalSlug,
            image_url: finalImage,
            author: authorName,
            status: 'processed',
            processed_at: new Date().toISOString()
        })
        .eq('id', article.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: `Processado (${modelUsed})` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})