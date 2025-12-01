import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ✅ MODELOS 2.5 FLASH (RÁPIDOS E EFICIENTES)
// Removemos o 3.0 Pro para evitar erros de quota/pagamento
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

const DEFAULT_IMAGE = "https://duodunk.com.br/images/agenda-nba-padrao.jpg";

// Helper de Autor por Fonte
const getAuthorBySource = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('cbs')) return 'Hugo Tamura';
    if (s.includes('yahoo')) return 'Maiara Pires';
    return 'Fernando Balley';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    console.log('🚀 [AI] Iniciando processamento com Gemini 2.5 Flash...');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY não encontrada.');

    const supabaseAdmin = createClient(
      Deno.env.get('PROJECT_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar artigo pendente
    const { data: article, error: fetchError } = await supabaseAdmin
      .from('articles_queue')
      .select('*')
      .in('status', ['pending_approval', 'auto_approved'])
      .is('body', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !article) {
      return new Response(JSON.stringify({ success: true, message: 'Fila vazia.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📰 Processando: ${article.original_title}`);

    // 2. Prompt Otimizado
    const prompt = `🏀 VOCÊ É UM JORNALISTA SÊNIOR DA NBA (PORTAL DUODUNK)

NOTÍCIA ORIGINAL (FONTE: ${article.source}):
Título: ${article.original_title}
Resumo: ${article.summary}

🎯 TAREFA: Escrever uma matéria jornalística profissional em Português do Brasil (PT-BR).

⚠️ DIRETRIZ DE TAMANHO (ADAPTÁVEL):
- Nota Rápida: 3-4 parágrafos.
- Análise: 5-8 parágrafos.

📝 ESTILO:
- Use termos técnicos (turnover, garrafão, clutch).
- Tom: Informativo, energético.
- Lead forte no primeiro parágrafo.
- Sem Markdown no texto final.

🎯 JSON DE RESPOSTA:
{
  "title": "Título Otimizado (Max 80 chars)",
  "subtitle": "Subtítulo complementar",
  "summary": "Resumo curto (Max 140 chars)",
  "paragraphs": ["P1...", "P2...", "..."],
  "tags": ["nba", "tag2", "tag3"],
  "meta_description": "SEO (150 chars)",
  "slug": "titulo-url-amigavel"
}
`;

    // 3. Chamada ao Gemini (Loop de Tentativa)
    let aiResponse = null;
    let modelUsed = '';

    for (const model of GEMINI_MODELS) {
        try {
            // console.log(`Tentando ${model}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  responseMimeType: "application/json"
                }
              })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`⚠️ Falha no ${model}: ${response.status} - ${errText.substring(0, 100)}`);
                continue; 
            }

            const json = await response.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (rawText) {
                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResponse = JSON.parse(cleanJson);
                modelUsed = model;
                break; // Sucesso
            }
        } catch (e: any) {
            console.error(`Erro técnico no ${model}:`, e.message);
        }
    }

    if (!aiResponse) throw new Error("Falha em todos os modelos Gemini 2.5. Verifique a chave ou limites.");

    // 4. Tratamento Final
    const bodyText = aiResponse.paragraphs.join('\n\n');
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
      model: modelUsed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro Fatal:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});