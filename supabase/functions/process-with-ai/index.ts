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

    const fullText = article.original_content || article.full_text || article.content || article.summary;

    if (!fullText || fullText.length < 200) {
        console.warn(`⚠️ Texto muito curto (${fullText?.length} chars).`);
    }

    const wordCount = fullText.split(/\s+/).length;
    // Reduzimos um pouco a exigência de tamanho para dar liberdade criativa, mas mantemos o mínimo
    const minWords = Math.floor(wordCount * 0.70); 
    
    console.log(`📝 Original: ${wordCount} palavras. Meta Criativa: ~${minWords} palavras.`);

    // 🔥 PROMPT DE JORNALISMO ESPORTIVO (REESCRITA CRIATIVA)
    const prompt = `
    ATUE COMO: Redator Sênior de NBA do portal DuoDunk.
    SUA MISSÃO: Transformar a notícia abaixo em um artigo original, engajador e com personalidade para o público brasileiro.

    TEXTO BASE (EM INGLÊS):
    """
    ${fullText}
    """

    🛑 REGRAS DE OURO (ANTI-ROBÔ):
    1. **NÃO TRADUZA LITERALMENTE:** Leia o texto, entenda os fatos e ESCREVA DO ZERO com suas próprias palavras. Evite frases que soem como tradução do Google.
    2. **USE TOM JORNALÍSTICO ESPORTIVO:** Use termos como "climão", "baixa importante", "cenário preocupante", "show em quadra". Seja dinâmico.
    3. **MANTENHA OS DADOS:** Nomes, números, lesões, prazos e placares devem ser EXATOS. Não invente dados, mas mude a forma de contá-los.
    4. **ESTRUTURA:** Comece com um lide forte (o que aconteceu e por que importa). Desenvolva o contexto. Termine com uma perspectiva futura.
    5. **TAMANHO:** O texto deve ser robusto (mínimo ${minWords} palavras). Se o original for curto, adicione contexto sobre a temporada dos times/jogadores envolvidos.

    SAÍDA JSON:
    {
      "title": "Título chamativo em PT-BR (max 80 chars, estilo manchete)",
      "subtitle": "Subtítulo que complementa e instiga a leitura",
      "summary": "Resumo curto e direto para redes sociais (max 140 chars)",
      "paragraphs": [
        "Parágrafo 1 (Lide forte)...",
        "Parágrafo 2 (Desenvolvimento com estilo)...",
        "Parágrafo 3 (Contexto e dados)...",
        "..."
      ],
      "tags": ["nba", "time", "jogador", "tema"],
      "meta_description": "SEO Description atrativa",
      "slug": "url-amigavel-baseada-no-titulo"
    }
    `;

    let aiResponse = null;
    let modelUsed = '';

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`🤖 Tentando ${model}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.4, // Aumentei um pouco para dar criatividade (0.4 é seguro)
                    maxOutputTokens: 8192, 
                    responseMimeType: "application/json" 
                }
              })
            });

            if (!response.ok) {
                const err = await response.text();
                console.warn(`Erro no ${model}: ${err.substring(0, 100)}`);
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

    if (!aiResponse) throw new Error("Falha na IA. Nenhum modelo respondeu adequadamente.");

    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('');
    const isOldBrokenPattern = article.image_url && (article.image_url.includes('agenda-nba-padrao.jpg') || article.image_url.includes('undefined') || article.image_url.length < 5);
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
    
    const finalWordCount = bodyText.split(/\s+/).length;
    console.log(`✅ Sucesso! Original: ${wordCount} -> Final (Criativo): ${finalWordCount}.`);

    return new Response(JSON.stringify({ success: true, model: modelUsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('❌ ERRO FATAL:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});