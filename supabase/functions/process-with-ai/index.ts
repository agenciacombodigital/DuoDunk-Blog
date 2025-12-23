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

    // --- PROMPT FINAL: FIDELIDADE DE TAMANHO + CONTEXTO HÍBRIDO ---
    const prompt = `
    ATUE COMO: Jornalista Esportivo Sênior da NBA (Portal DuoDunk).
    
    FONTE: ${article.source}
    TITULO ORIGINAL: ${article.original_title}
    CONTEÚDO ORIGINAL: 
    """
    ${article.summary}
    """

    OBJETIVO: Produzir uma matéria completa em PT-BR, mantendo a PROFUNDIDADE, o TOM e, principalmente, a EXTENSÃO do texto original.

    🚫 PROIBIÇÃO ABSOLUTA DE RESUMIR:
    1.  **FIDELIDADE DE TAMANHO:** O seu texto final deve ter um tamanho comparável ao original. Não condense 5 parágrafos em 2. Se o original detalha uma jogada ou uma acusação judicial, você deve detalhar também.
    2.  **NÃO CORTE CONTEÚDO:** Mantenha todas as citações (aspas), nomes citados, dados financeiros, datas e contextos históricos presentes no original.
    3.  **NÃO INVENTE:** Não adicione fatos que não existem. Apenas expanda a narrativa com base no que foi fornecido.

    🧠 LÓGICA ADAPTATIVA (IDENTIFIQUE O TIPO DE NOTÍCIA):
    
    [CENÁRIO A] SE FOR UM JOGO ("Game Recap", Recordes, Atuações):
       - OBRIGATÓRIO: Cite todos os números: Placar, Pontos, Rebotes, Assistências, Tocos.
       - "Fulano fez 30 pontos" é melhor que "Fulano jogou muito bem".
    
    [CENÁRIO B] SE FOR NOTÍCIA GERAL (Jurídico, Trocas, Lesões, Polêmicas):
       - OBRIGATÓRIO: Narre os fatos cronologicamente.
       - Explique os termos (ex: valores de multas, detalhes de contratos, acusações).
       - ⚠️ CRÍTICO: NÃO procure por "pontos ou rebotes" se a notícia for sobre tribunal ou negócios. NÃO escreva frases dizendo "esta notícia não tem estatísticas". Apenas narre a história.

    ESTRUTURA OBRIGATÓRIA:
    - P1 (Lead): O fato principal completo.
    - P2 a P5 (Desenvolvimento Detalhado): Aqui você deve gastar tempo. Descreva o desenrolar dos fatos, traduza as aspas completas dos envolvidos, traga os dados específicos.
    - P6 (Conclusão): O que acontece agora? (Próximo jogo, data de julgamento, tempo de recuperação, etc).

    SAÍDA JSON (MANTENHA ESTE FORMATO):
    {
      "title": "Título Jornalístico em PT-BR (Max 80 chars)",
      "subtitle": "Subtítulo complementar informativo",
      "summary": "Resumo curto para o card (Max 140 chars)",
      "paragraphs": [
        "Parágrafo denso e informativo 1...",
        "Parágrafo denso e informativo 2...",
        "Parágrafo denso e informativo 3...",
        "Parágrafo denso e informativo 4...",
        "Parágrafo denso e informativo 5..."
      ],
      "tags": ["nba", "time", "jogador", "tema"],
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