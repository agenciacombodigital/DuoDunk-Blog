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

    console.log(`📰 Traduzindo com Fidelidade: ${article.original_title}`);

    // --- PROMPT DE TRADUÇÃO JORNALÍSTICA (SEM RESUMO) ---
    const prompt = `
    ATUE COMO: Tradutor Especialista em NBA do Portal DuoDunk.
    
    SUA MISSÃO: Converter a notícia abaixo do Inglês para Português (Brasil) mantendo 100% dos detalhes informativos.

    TEXTO ORIGINAL:
    """
    ${article.summary}
    """

    🚨 REGRAS DE OURO (NÃO QUEBRE):
    1. **FIDELIDADE TOTAL:** No resuma. Se o texto original tem 4 parágrafos, o seu deve ter 4 parágrafos ou mais.
    2. **NOMES E TIMES:** Mantenha EXATAMENTE os nomes e times do texto (ex: se diz "Anthony Davis no Mavericks", escreva "Anthony Davis do Mavericks"). Não corrija a realidade.
    3. **ESTATÍSTICAS:** Se o texto cita médias (ex: 26.6 ppg), lesões (Grau 2) ou prazos (4 semanas), esses números PRECISAM aparecer no texto final.
    4. **LINGUAGEM:** Use termos do basquete brasileiro (ex: "Grade 2 strain" -> "Lesão de grau 2", "out" -> "desfalcará").
    5. **PROIBIDO TERMOS GENÉRICOS:** Nunca comece com "Um jogador não identificado". Comece com "O armador Austin Reaves..." (ou quem for o sujeito).

    SAÍDA JSON OBRIGATÓRIA:
    {
      "title": "Título traduzido de forma atraente (max 80 chars)",
      "subtitle": "Subtítulo com a informação chave (lesão, troca, recorde)",
      "summary": "Resumo curto para redes sociais (max 140 chars)",
      "paragraphs": [
        "Parágrafo 1: Introdução completa (Quem, Onde, O Quê, Time)...",
        "Parágrafo 2: Detalhes específicas citados no texto...",
        "Parágrafo 3: Estatísticas e contexto mencionado...",
        "Parágrafo 4: Conclusão ou próximos jogos citados..."
      ],
      "tags": ["nba", "time_do_texto", "jogador_do_texto", "assunto"],
      "meta_description": "Resumo SEO (150 chars)",
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
                  temperature: 0.1, // Temperatura mínima para garantir que ele siga o texto estritamente
                  maxOutputTokens: 8192,
                  responseMimeType: "application/json"
                }
              })
            });

            if (!response.ok) {
                const err = await response.text();
                console.error(`Erro API (${model}):`, err);
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

    if (!aiResponse) throw new Error("Falha na IA. Verifique se o texto original não está vazio.");

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