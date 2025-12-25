import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { offset = 0, limit = 100 } = await req.json();

    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    if (!AUDITOR_API_KEY) throw new Error("API Key ausente.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Busca Lote
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    
    if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ duplicates: [], hasMore: false, nextOffset: offset }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Auditor] Processando ${questions.length} itens (Offset: ${offset})...`);

    // 2. Preparação dos dados
    const csvData = questions.map(q => `ID: ${q.id} | TXT: ${q.question}`).join("\n");
    
    // Usando 2.5-flash-lite (Rápido e barato, mas precisa de prompt forte)
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    // --- PROMPT DE ALTA PRECISÃO (FEW-SHOT) ---
    const prompt = `
    ATUE COMO: Auditor Rigoroso de Banco de Dados de Trivia.
    
    OBJETIVO: Identificar perguntas DUPLICADAS (mesmo significado exato e mesma resposta esperada).

    🚨 REGRAS DE EXCLUSÃO (LEIA COM ATENÇÃO):
    1. Perguntas sobre o MESMO TEMA mas focos diferentes NÃO SÃO duplicatas.
    2. Perguntas com palavras parecidas mas sentidos diferentes NÃO SÃO duplicatas.

    EXEMPLOS PARA APRENDER:
    [CASO 1 - NÃO É DUPLICATA]
    P1: "Qual time Kobe Bryant jogou?"
    P2: "Quantos títulos Kobe Bryant ganhou?"
    DECISÃO: Diferentes (Mesmo sujeito, perguntas diferentes).

    [CASO 2 - NÃO É DUPLICATA]
    P1: "Quem é o maior rival do Lakers?"
    P2: "Quem era o astro do Lakers contra o Celtics nos anos 80?"
    DECISÃO: Diferentes (Tópico Lakers, mas focos distintos).

    [CASO 3 - É DUPLICATA REAL]
    P1: "Quem ganhou o MVP de 2016?"
    P2: "Qual jogador foi eleito o Most Valuable Player na temporada 2015-16?"
    DECISÃO: Duplicata (Perguntam exatamente a mesma coisa).

    AGORA ANALISE ESTA LISTA:
    ${csvData}

    SAÍDA OBRIGATÓRIA (JSON ARRAY DE ARRAYS):
    Retorne apenas os grupos que são IDÊNTICOS em significado. Se não houver certeza absoluta, ignore.
    Exemplo: [[{"id": "1", "question": "a"}, {"id": "5", "question": "a"}]]
    `;

    // 3. Chamada API
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.0 // Temperatura ZERO para máxima lógica e zero criatividade
        }
    });

    let duplicates = [];
    try {
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        duplicates = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro Parse JSON IA:", e.message);
        duplicates = [];
    }

    return new Response(JSON.stringify({ 
        duplicates: Array.isArray(duplicates) ? duplicates : [], 
        hasMore: questions.length === limit, 
        nextOffset: offset + limit 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[Fatal Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message, duplicates: [], hasMore: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})