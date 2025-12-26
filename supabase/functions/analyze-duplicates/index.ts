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
    // Lote reduzido para garantir que a IA preste atenção em cada item
    const { offset = 0, limit = 30 } = await req.json();

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

    const csvData = questions.map(q => `ID: ${q.id} | TXT: ${q.question}`).join("\n");
    
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    
    // ATUALIZAÇÃO: Usando 'gemini-2.5-flash' (Standard) para maior inteligência lógica
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // --- PROMPT "LÓGICA ESTRITA" ---
    const prompt = `
    ATUE COMO: Auditor Sênior de Banco de Dados (Nível Perito).
    TAREFA: Identificar DUPLICATAS EXATAS (Redundância Semântica Total).
    
    REGRA DE OURO (O "TESTE DA DIFERENÇA"):
    Para cada par suspeito, tente encontrar UMA única diferença:
    1. O SUJEITO é diferente? (Ex: "LeBron" vs "Jordan") -> DIFERENTE.
    2. O OBJETO é diferente? (Ex: "Pontos" vs "Rebotes") -> DIFERENTE.
    3. O TEMPO é diferente? (Ex: "2016" vs "2017") -> DIFERENTE.
    4. A RESPOSTA CORRETA seria diferente? -> DIFERENTE.

    SÓ É DUPLICATA SE A RESPOSTA FOR EXATAMENTE A MESMA PARA AMBAS.

    EXEMPLOS DE "PARECE MAS NÃO É" (NÃO AGRUPAR):
    - "Qual o mascote do Bulls?" vs "Qual o mascote do Hornets?" (Sujeitos diferentes).
    - "Recorde de pontos" vs "Recorde de assistências" (Objetos diferentes).
    - "Quem é o Greek Freak?" vs "Posição do draft do Giannis?" (Perguntas diferentes sobre a mesma pessoa).

    EXEMPLO DE DUPLICATA REAL (AGRUPAR):
    - "Quem foi o MVP de 2016?"
    - "Qual jogador ganhou o prêmio de Jogador Mais Valioso na temporada 2015-2016?"
    (Ambas perguntam sobre o prêmio de Curry em 2016).

    LISTA PARA AUDITAR:
    ${csvData}

    SAÍDA JSON:
    Retorne APENAS um Array de Arrays com os objetos completos das duplicatas confirmadas.
    Exemplo: [[{"id":1, "question":"..."}, {"id":5, "question":"..."}]]
    Se não houver certeza absoluta, retorne [].
    `;

    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            // @ts-ignore
            responseMimeType: "application/json",
            temperature: 0.0 // Criatividade zero
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
    
    // Tratamento de erro 429 (Rate Limit)
    let msg = error.message;
    if (msg.includes("429") || msg.includes("quota")) {
        msg = "Limite de IA atingido (429). O sistema tentará novamente em breve.";
    }
    
    return new Response(JSON.stringify({ error: msg, duplicates: [], hasMore: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})