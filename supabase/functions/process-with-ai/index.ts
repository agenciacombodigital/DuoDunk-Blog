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

    // Busca o texto mais completo disponível
    const fullText = article.original_content || article.full_text || article.content || article.summary;

    if (!fullText || fullText.length < 200) {
        console.warn(`⚠️ Texto muito curto (${fullText?.length} chars). Verifique os logs do Scraper.`);
    }

    // --- CÁLCULO DE PALAVRAS (A CHAVE DO SUCESSO) ---
    const wordCount = fullText.split(/\s+/).length;
    const minTarget = Math.floor(wordCount * 0.85); // Meta: 85% do original
    
    console.log(`📝 Original: ${wordCount} palavras. Meta para IA: ~${minTarget} palavras.`);

    const prompt = `
    VOCÊ É: "Tradutor Espelho" especializado em NBA do DuoDunk.
    MISSÃO: Converter o texto do Inglês para Português (Brasil) MANTENDO A EXTENSÃO ORIGINAL.

    TEXTO ORIGINAL (${wordCount} palavras):
    """
    ${fullText}
    """

    🛑 REGRAS MATEMÁTICAS (NÃO RESUMA):
    1. **TAMANHO:** O original tem ${wordCount} palavras. Seu texto deve ter no mínimo ${minTarget} palavras.
    2. **ESTRUTURA:** Se o original tem 6 parágrafos, entregue 6 parágrafos.
    3. **DADOS:** Não corte estatísticas, nomes de jogadores secundários ou citações. Traduza tudo.
    4. **ESTILO:** Jornalístico profissional (ESPN/SporTV).

    SAÍDA JSON:
    {
      "title": "Título traduzido (fiel ao original)",
      "subtitle": "Subtítulo informativo",
      "summary": "Resumo curto (max 140 chars)",
      "paragraphs": [
        "Parágrafo 1...", "Parágrafo 2...", "Parágrafo 3...", "..."
      ],
      "tags": ["nba", "time", "jogador", "topico"],
      "meta_description": "SEO Description",
      "slug": "url-amigavel"
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
                    temperature: 0.1, 
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
    return new Response(JSON.stringify({ success: true, model: modelUsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('❌ ERRO FATAL:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});