import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ✅ CONFIGURAÇÃO DE MODELOS (EFICIÊNCIA)
// 1. Tenta o Flash (Padrão ouro).
// 2. Se falhar, tenta o Flash-Lite (Backup).
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

    if (fetchError || !article) {
      return new Response(
        JSON.stringify({ success: true, message: 'Fila vazia.' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📰 Processando: ${article.original_title}`);

    // --- BUSCA DO TEXTO INTEGRAL (CRÍTICO) ---
    // A IA precisa do texto completo para não omitir dados.
    // O código busca em ordem de preferência: original_content -> full_text -> content -> summary
    const fullText = article.original_content || article.full_text || article.content || article.summary;
    
    if (!fullText || fullText.length < 100) {
       // Apenas avisa, mas tenta processar mesmo assim (melhor algo do que nada)
       console.warn('⚠️ Texto original curto. Risco de perda de detalhes.');
    } else {
       console.log(`📝 Texto base carregado: ${fullText.length} caracteres`);
    }

    // --- PROMPT: TRADUTOR JORNALÍSTICO FIEL ---
    const prompt = `
    ATUE COMO: Jornalista Esportivo Sênior da NBA (DuoDunk).
    
    TAREFA: Traduzir e adaptar a notícia abaixo para Português (Brasil) com FIDELIDADE TOTAL aos fatos.

    TEXTO ORIGINAL (FONTE):
    """
    ${fullText}
    """

    🛑 REGRAS DE OURO (PARA NÃO OMITIR DADOS):
    1. **NÃO RESUMA:** Mantenha a extensão e profundidade do texto original. Se houver 3 parágrafos, traduza os 3.
    2. **NOMES PRÓPRIOS:** Mantenha TODOS os nomes de jogadores e times citados. (Ex: Se diz "Austin Reaves", escreva "Austin Reaves". Não use "um jogador").
    3. **NÚMEROS E PRAZOS:** Mantenha estatísticas (pontos, assistências), placares e tempos de recuperação de lesão exatos.
    4. **REALIDADE DO TEXTO:** Se o texto diz que o jogador está no time X, ele está no time X. O texto é a verdade absoluta.
    5. **ESTILO:** Linguagem esportiva fluida (ex: "calf strain" = "lesão na panturrilha").

    SAÍDA JSON OBRIGATÓRIA:
    {
      "title": "Título atrativo em PT-BR (max 80 chars)",
      "subtitle": "Subtítulo com a informação principal",
      "summary": "Resumo curto para redes sociais (max 140 chars)",
      "paragraphs": [
        "Parágrafo 1: Lide jornalístico completo...",
        "Parágrafo 2: Detalhes, diagnósticos e citações...",
        "Parágrafo 3: Estatísticas e contexto...",
        "Parágrafo 4+: Conclusão e próximos passos..."
      ],
      "tags": ["nba", "time_citado", "jogador_citado", "assunto"],
      "meta_description": "Descrição SEO (150 chars)",
      "slug": "titulo-url-amigavel"
    }
    `;

    let aiResponse = null;
    let modelUsed = '';
    let lastError = '';

    // Loop de Tentativa (Flash -> Flash Lite)
    for (const model of GEMINI_MODELS) {
        try {
            console.log(`🤖 Tentando modelo: ${model}...`);
            
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, 
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.1, // Baixa para fidelidade máxima
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                  }
                })
              }
            );

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`⚠️ Falha no ${model}: ${response.status}`);
                lastError = `${model} (${response.status})`;
                continue; // Tenta o próximo (Lite)
            }

            const json = await response.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (rawText) {
                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResponse = JSON.parse(cleanJson);
                modelUsed = model;
                console.log(`✅ SUCESSO com: ${model}`);
                break;
            }
        } catch (e) { 
          console.error(`❌ Erro técnico no ${model}:`, e);
          lastError = e.message;
        }
    }

    if (!aiResponse || !aiResponse.paragraphs || aiResponse.paragraphs.length === 0) {
      throw new Error(`Falha em todos os modelos. Último erro: ${lastError}`);
    }

    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('\n');
    
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processado (${modelUsed})`,
        stats: { paragraphs: aiResponse.paragraphs.length }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ ERRO FATAL:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});