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
    const minWords = Math.floor(wordCount * 0.70); 
    
    console.log(`📝 Original: ${wordCount} palavras. Meta Criativa: ~${minWords} palavras.`);

    // 🔥 NOVO PROMPT REFINADO (HUMAN-LIKE)
    const prompt = `
Você é um redator brasileiro de esportes que escreve para o portal DuoDunk — um blog de NBA com linguagem descontraída, direta e apaixonada pelo basquete.

Seu trabalho é transformar o texto abaixo em um artigo em português, escrito como se fosse um jornalista humano empolgado com a notícia.

TEXTO ORIGINAL (em inglês):
"""
${fullText}
"""

COMO ESCREVER (leia com atenção):
- Escreva como se estivesse contando a novidade para um amigo que também curte NBA. Natural, sem frescura.
- Varie bastante o tamanho das frases. Algumas curtas. Outras mais longas, com mais contexto e detalhes. Isso é fundamental.
- NUNCA use travessão (—) para separar ideias. Use vírgulas, parênteses ou simplesmente quebre em outra frase.
- Evite começar muitas frases seguidas com a mesma palavra ou estrutura.
- Troque frases genéricas por expressões do dia a dia do esporte: "deu trabalho", "foi pra cima", "não deixou barato", "jogou o peso do nome", "tá num momento", "se impôs".
- Use parágrafos curtos. Máximo 3 ou 4 linhas cada.
- Não use listas com bullet points. Tudo em texto corrido.
- Não use palavras de transição robóticas como "Ademais", "Portanto", "Destarte", "Vale ressaltar que", "No contexto atual", "Em suma", "Não obstante".
- Conclua o artigo de forma natural, com uma perspectiva sobre o que vem pela frente — sem soar como resumo de relatório.

PRECISÃO DOS DADOS (obrigatório):
- Preserve exatamente: nomes, datas, placares, times, arenas, valores de contrato e lesões.
- Se o texto diz "9 e 11 de outubro", escreva "9 e 11 de outubro". Nunca generalize.

TAMANHO: No mínimo ${minWords} palavras nel corpo do artigo.

Responda SOMENTE com o JSON abaixo, sem nenhum texto fora dele:
{
  "title": "Título chamativo em PT-BR (máx 80 caracteres, estilo manchete de jornal esportivo)",
  "subtitle": "Subtítulo que complementa e instiga a leitura",
  "summary": "Resumo curto e direto para redes sociais (máx 140 caracteres)",
  "paragraphs": [
    "Parágrafo 1...",
    "Parágrafo 2...",
    "..."
  ],
  "tags": ["nba", "time", "jogador", "tema"],
  "meta_description": "Descrição SEO atrativa",
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
                    temperature: 0.3, 
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
    console.log(`✅ Sucesso! Original: ${wordCount} -> Final (Preciso): ${finalWordCount}.`);

    return new Response(JSON.stringify({ success: true, model: modelUsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('❌ ERRO FATAL:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});