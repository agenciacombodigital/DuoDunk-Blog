import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Usando o modelo mais inteligente e atual
const GEMINI_MODELS = ['gemini-2.0-flash-exp', 'gemini-1.5-flash']; 
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

    // ✅ CORREÇÃO CRÍTICA: Prioridade para encontrar o texto COMPLETO
    const fullText = article.original_content || article.full_text || article.content || article.summary;
    
    if (!fullText || fullText.length < 100) {
      console.error('❌ Texto original muito curto ou vazio (IA não tem o que traduzir).');
      console.error('Conteúdo recebido:', fullText);
      throw new Error('Texto original insuficiente para processamento. Verifique o Scraper.');
    }

    console.log(`📝 Tamanho do texto original para IA: ${fullText.length} caracteres`);

    // --- PROMPT DE TRADUTOR JORNALÍSTICO (FIDELIDADE TOTAL) ---
    const prompt = `
    ATUE COMO: Tradutor Especialista em NBA do Portal DuoDunk.
    
    TAREFA: Traduzir a notícia abaixo do Inglês para Português (Brasil), mantendo 100% dos detalhes informativos.

    TEXTO ORIGINAL (EM INGLÊS):
    """
    ${fullText}
    """

    📋 REGRAS DE OURO (FIDELIDADE):
    1. **NÃO RESUMA:** Se o texto original tem 500 palavras, o seu deve ter ~500 palavras. Traduza parágrafo por parágrafo.
    2. **PRESERVE OS DADOS:**
       - Nomes de jogadores e times (NUNCA omita. Se diz "Austin Reaves", escreva "Austin Reaves").
       - Estatísticas (pontos, médias, recordes).
       - Prazos médicos (ex: "4 semanas").
       - Citações entre aspas.
    3. **TERMINOLOGIA:** Use termos do basquete brasileiro (ex: "calf strain" -> "lesão na panturrilha").
    4. **NÃO INVENTE:** Não adicione opiniões que não estão no texto. Apenas traduza e adapte o estilo jornalístico.

    FORMATO DE SAÍDA (JSON):
    {
      "title": "Título traduzido atrativo (max 80 chars)",
      "subtitle": "Subtítulo com a informação chave",
      "summary": "Resumo curto para redes sociais (max 140 chars)",
      "paragraphs": [
        "Parágrafo 1: Lide completo...",
        "Parágrafo 2: Detalhes...",
        "Parágrafo 3: Contexto...",
        "Parágrafo 4+: Demais informações..."
      ],
      "tags": ["nba", "time", "jogador", "topico"],
      "meta_description": "SEO Description (150 chars)",
      "slug": "titulo-url-amigavel"
    }
    `;

    let aiResponse = null;
    let modelUsed = '';

    for (const model of GEMINI_MODELS) {
        try {
            console.log(`🤖 Tentando modelo: ${model}`);
            
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, 
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    temperature: 0.2, // Baixa para manter fidelidade
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                  }
                })
              }
            );

            if (!response.ok) {
                const err = await response.text();
                console.error(`❌ Erro API (${model}):`, err);
                continue;
            }

            const json = await response.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (rawText) {
                // Limpeza extra para garantir JSON válido
                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                aiResponse = JSON.parse(cleanJson);
                modelUsed = model;
                console.log(`✅ Sucesso com modelo: ${model}`);
                console.log(`📊 Parágrafos gerados: ${aiResponse.paragraphs?.length}`);
                break;
            }
        } catch (e) { 
          console.error(`❌ Erro ao processar ${model}:`, e); 
        }
    }

    if (!aiResponse || !aiResponse.paragraphs || aiResponse.paragraphs.length === 0) {
      throw new Error("IA não retornou conteúdo válido. Verifique o texto original.");
    }

    const bodyText = aiResponse.paragraphs.map((p: string) => `<p>${p}</p>`).join('\n');
    
    // Validação de qualidade (Alerta se o texto encolheu muito)
    if (bodyText.length < fullText.length * 0.5) {
      console.warn('⚠️ AVISO: Texto traduzido muito menor que o original (Possível resumo indesejado).');
      console.warn(`Original: ${fullText.length} chars | Traduzido: ${bodyText.length} chars`);
    }

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

    console.log(`✅ Artigo processado com sucesso!`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processado com sucesso (${modelUsed})`,
        stats: {
          paragraphs: aiResponse.paragraphs.length,
          originalSize: fullText.length,
          translatedSize: bodyText.length
        }
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