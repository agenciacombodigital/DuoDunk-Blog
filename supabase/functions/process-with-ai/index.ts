import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

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
    console.log('🚀 [AI] Iniciando processamento (Modo Fiel)...');

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

    if (fetchError || !article) {
      return new Response(JSON.stringify({ success: true, message: 'Fila vazia.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📰 Processando: ${article.original_title}`);

    // 2. Prompt Blindado contra Alucinações
    const prompt = `🏀 ATUE COMO REDATOR JORNALÍSTICO (PORTAL DUODUNK)

FONTE: ${article.source}
TITULO ORIGINAL: ${article.original_title}
TEXTO ORIGINAL: "${article.summary}"

🎯 TAREFA: Reescrever a notícia acima em Português do Brasil (PT-BR).

⛔ REGRAS DE OURO (FIDELIDADE TOTAL):
1. USE APENAS AS INFORMAÇÕES DO "TEXTO ORIGINAL".
2. NÃO ADICIONE informações externas que não estejam no texto (não cite jogadores, times ou estatísticas que não foram mencionados).
3. NÃO INVENTE cenários. Se o texto é curto, faça uma notícia curta.
4. Se o texto original estiver incompleto, traduza apenas o que existe.

📝 FORMATO:
- Linguagem profissional de basquete.
- Separação clara de parágrafos.

🎯 JSON DE RESPOSTA:
{
  "title": "Título em PT-BR (Baseado estritamente no original)",
  "subtitle": "Subtítulo complementar",
  "summary": "Resumo curto (Max 140 chars)",
  "paragraphs": ["Parágrafo 1...", "Parágrafo 2..."],
  "tags": ["nba", "tag_do_texto"],
  "meta_description": "SEO",
  "slug": "slug-url"
}
`;

    // 3. Chamada AI
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
                  temperature: 0.3, // ❄️ BAIXA TEMPERATURA PARA EVITAR INVENÇÕES
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

    // 4. Tratamento Final
    // Envolve parágrafos em <p>
    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('');
    
    const finalSlug = aiResponse.slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const finalImage = article.image_url || DEFAULT_IMAGE;
    const authorName = getAuthorBySource(article.source);

    const updateData = {
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
    };

    const { error: updateError } = await supabaseAdmin
        .from('articles_queue')
        .update(updateData)
        .eq('id', article.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processado (${modelUsed}): ${aiResponse.title}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});