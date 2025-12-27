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

    console.log(`📰 Processando (Modo Simulação): ${article.original_title}`);

    // --- PROMPT "MODO SIMULAÇÃO DE FUTURO" ---
    const prompt = `
    CONTEXTO DO SISTEMA: Você é o redator chefe de um "Simulador de Gestão da NBA" que se passa no futuro (Temporada 2026/2027).
    
    SUA TAREFA: Transformar o LOG DE EVENTOS da simulação (texto abaixo) em uma notícia realista em PT-BR.

    ⚠️ REGRAS DE REALIDADE DA SIMULAÇÃO (CRÍTICO):
    1. O texto abaixo é a VERDADE ABSOLUTA deste universo simulado.
    2. Se o texto diz "Anthony Davis (Mavericks)", ACEITE QUE ELE É DO MAVERICKS. Não corrija para Lakers.
    3. Se o texto diz "Austin Reaves", use o nome "Austin Reaves". NÃO escreva "um jogador".
    4. NÃO use seu conhecimento de 2024/2025. Use APENAS os dados do texto abaixo.

    LOG DE EVENTOS (TEXTO ORIGINAL):
    """
    ${article.summary}
    """

    INSTRUÇÕES DE ESCRITA:
    - Escreva como uma matéria séria de jornalismo esportivo (ESPN/UOL).
    - Mantenha TODOS os números, estátisticas, prazos de lesão e nomes citados.
    - Se o texto original for longo, o seu também deve ser. Não resuma.
    - Traduza termos técnicos para o linguajar do basquete brasileiro (ex: "calf strain" -> "lesão na panturrilha/gêmeo").

    SAÍDA JSON OBRIGATÓRIA:
    {
      "title": "Título Jornalístico (Ex: 'Davis desfalca Mavericks por 4 semanas')",
      "subtitle": "Subtítulo detalhado",
      "summary": "Resumo curto para o feed (Max 140 chars)",
      "paragraphs": [
        "Parágrafo 1: O Fato Principal (Quem, Time, O Quê)...",
        "Parágrafo 2: Detalhes da Lesão/Acontecimento...",
        "Parágrafo 3: Estatísticas do jogador mencionadas no texto...",
        "Parágrafo 4: Impacto no time e próximos jogos...",
        "Parágrafo 5: Contexto adicional do texto original..."
      ],
      "tags": ["nba", "nome_do_time_no_texto", "nome_do_jogador", "tipo_lesao"],
      "meta_description": "Descrição SEO completa",
      "slug": "titulo-amigavel-url"
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
                  temperature: 0.1, // Temperatura mínima para obediência total
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

    if (!aiResponse) throw new Error("Falha na IA. Nenhum modelo retornou JSON válido.");

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

    return new Response(JSON.stringify({ success: true, message: `Processado com sucesso (${modelUsed})` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});