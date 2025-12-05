import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ✅ MODELOS 2.5 (Rápidos e Eficientes)
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
    console.log('🚀 [AI] Iniciando processamento (Modo Proporcional)...');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY não encontrada.');

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar artigo
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

    // 2. Prompt Ajustado para PROPORCIONALIDADE
    const prompt = `🏀 ATUE COMO JORNALISTA SÊNIOR (PORTAL DUODUNK)

FONTE: ${article.source}
TITULO ORIGINAL: ${article.original_title}
TEXTO ORIGINAL: "${article.summary}"

🎯 TAREFA: Traduzir e adaptar a notícia para PT-BR.

📏 DIRETRIZ DE TAMANHO (IMPORTANTE):
1. SEJA PROPORCIONAL: Se o texto original for curto (uma nota), escreva uma notícia curta (3-4 parágrafos). Se for longo (análise/jogo), escreva um texto longo e detalhado.
2. NÃO ENCHA LINGUIÇA: Não invente informações que não estão no texto original apenas para aumentar o tamanho.
3. FOCO NO FATO: Vá direto ao ponto no primeiro parágrafo (Lead).

JSON RESPOSTA:
{
  "title": "Título em PT-BR (Max 80 chars)",
  "subtitle": "Subtítulo complementar",
  "summary": "Resumo curto (Max 140 chars)",
  "paragraphs": ["Parágrafo 1...", "Parágrafo 2...", "..."],
  "tags": ["nba", "tag_relevante"],
  "meta_description": "SEO (150 chars)",
  "slug": "slug-url"
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
                  temperature: 0.3, // Baixa temperatura para fidelidade
                  maxOutputTokens: 8192, // Limite técnico alto, mas o prompt controla o tamanho real
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

    // 4. Salvar (HTML Formatado)
    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('');
    
    const finalSlug = finalSlug = aiResponse.slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
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

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});