import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Usando o modelo mais inteligente disponível
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

    console.log(`📰 Processando: ${article.original_title}`);

    // --- PROMPT DE ALTA FIDELIDADE E EXTRAÇÃO DE DADOS ---
    const prompt = `
    ATUE COMO: Jornalista Esportivo Sênior da NBA (DuoDunk).
    TAREFA: Traduzir e Adaptar a notícia para PT-BR com FIDELIDADE TOTAL aos fatos.

    TEXTO ORIGINAL:
    """
    ${article.summary}
    """

    🚨 REGRAS DE OURO (PROIBIDO FALHAR):
    1. **NÃO OMITA NOMES:** Se o texto diz "Austin Reaves", você DEVE escrever "Austin Reaves". NUNCA escreva "um jogador" ou "o atleta" sem antes citar o nome.
    2. **NÃO OMITA NÚMEROS:** Se o texto tem médias de pontos (ex: 26.6), prazos (ex: 4 semanas) ou placares, ELES DEVEM ESTAR NO TEXTO FINAL.
    3. **NÃO RESUMA:** O texto final deve ter aproximadamente o mesmo tamanho e detalhamento do original.
    4. **ANTI-ALUCINAÇÃO DE TIME:** Respeite o time citado no texto. Se diz que Davis está no Dallas, ele está no Dallas.

    🧠 PASSO A PASSO (RACIOCÍNIO OBRIGATÓRIO):
    - Extraia: NOME DO JOGADOR PRINCIPAL.
    - Extraia: TIME ATUAL DO JOGADOR (conforme o texto).
    - Extraia: DETALHES DA LESÃO/FATO (Tipo, Grau, Tempo de recuperação).
    - Extraia: ESTATÍSTICAS CITADAS (Pontos, Rebotes, etc).
    
    Agora, escreva a notícia em PT-BR usando TODOS os dados extraídos acima. Use linguagem de jornalista esportivo brasileiro.

    SAÍDA JSON:
    {
      "title": "Título Jornalístico com Nome do Jogador e Time (Max 80 chars)",
      "subtitle": "Subtítulo com detalhe importante (ex: tempo de fora)",
      "summary": "Resumo curto (Max 140 chars)",
      "paragraphs": [
        "Parágrafo 1 (Lide completo com NOME, TIME e O QUE ACONTECEU)...",
        "Parágrafo 2 (Detalhes da lesão/fato e prazos)...",
        "Parágrafo 3 (Estatísticas e impacto no time)...",
        "Parágrafo 4 (Contexto adicional ou histórico)...",
        "Parágrafo 5 (Conclusão ou próximos jogos)..."
      ],
      "tags": ["nba", "nome_do_time", "nome_do_jogador", "topico"],
      "meta_description": "SEO Description com o nome do jogador e a notícia principal (150 chars)",
      "slug": "titulo-url-amigavel"
    }
    `;

    let aiResponse = null;
    let modelUsed = '';

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`Tentando modelo: ${model}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1, // Temperatura baixa para máxima precisão factual
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json"
                }
              })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`Erro no modelo ${model}:`, errText);
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

    if (!aiResponse) throw new Error(`Falha na IA. Verifique API Key e Quota.`);

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
    console.error("Erro Fatal:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});