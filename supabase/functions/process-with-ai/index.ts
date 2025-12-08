import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// MODELOS 2.5 (Rápidos)
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
    console.log('🚀 [AI] Iniciando processamento (Modo Texto Completo)...');

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

    // --- PROMPT AJUSTADO PARA MANTER O TAMANHO ---
    const prompt = `🏀 ATUE COMO JORNALISTA SÊNIOR DA NBA (PORTAL DUODUNK)

FONTE: ${article.source}
TITULO ORIGINAL: ${article.original_title}
CONTEÚDO ORIGINAL: "${article.summary}"

🎯 TAREFA: Reescrever a notícia em PT-BR mantendo a PROFUNDIDADE e o TAMANHO do original.

🚫 PROIBIDO RESUMIR:
- Se o texto original é longo, sua resposta DEVE ser longa.
- Não corte detalhes técnicos, citações ou estatísticas.
- Não simplifique a linguagem, mantenha o nível técnico.

✅ ESTRUTURA OBRIGATÓRIA:
1. LEAD (P1): O que aconteceu, quem, quando e onde (4-5 linhas).
2. DESENVOLVIMENTO (P2-P4): Detalhes do jogo/fato, estatísticas, aspas dos jogadores.
3. CONTEXTO (P5): Impacto na classificação ou histórico recente.
4. CONCLUSÃO (P6): O que vem a seguir.

⚠️ IMPORTANTE: 
- Use termos da NBA (turnover, triple-double, garrafão).
- NÃO invente fatos que não estão no texto original. Apenas expanda a escrita para torná-la fluida.

JSON RESPOSTA:
{
  "title": "Título Impactante em PT-BR (Max 80 chars)",
  "subtitle": "Subtítulo complementar",
  "summary": "Resumo curto para o card (Max 140 chars)",
  "paragraphs": [
    "Parágrafo 1...", 
    "Parágrafo 2...", 
    "Parágrafo 3...",
    "Parágrafo 4...",
    "Parágrafo 5..."
  ],
  "tags": ["nba", "time", "jogador"],
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
                  temperature: 0.4, // Um pouco mais fluido para permitir reescrita longa
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

    // Tratamento de HTML para parágrafos
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
});