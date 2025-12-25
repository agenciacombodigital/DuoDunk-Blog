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
    // REDUÇÃO DE LOTE: 50 itens para garantir precisão máxima da IA
    const { offset = 0, limit = 50 } = await req.json();

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
    
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    // --- PROMPT BLINDADO (CHAIN-OF-THOUGHT) ---
    const prompt = `
    ATUE COMO: Auditor Lógico de Banco de Dados.
    TAREFA: Encontrar perguntas DUPLICADAS (Semântica IDÊNTICA).

    🚨 REGRAS DE OURO (Critério de Exclusão):
    1. Se o SUJEITO for diferente (ex: "Mascote do Jazz" vs "Mascote do Celtics"), NÃO É DUPLICATA.
    2. Se o ANO/TEMPORADA for diferente (ex: "MVP de 2016" vs "MVP de 2017"), NÃO É DUPLICATA.
    3. Se o FOCO for diferente (ex: "Quem jogou" vs "Quantos títulos"), NÃO É DUPLICATA.

    RACIOCÍNIO ESPERADO (Passo a Passo):
    - Passo 1: Leia a Pergunta A e a Pergunta B.
    - Passo 2: O sujeito é o mesmo? Se não, descarte.
    - Passo 3: O predicado (ação) é o mesmo? Se não, descarte.
    - Passo 4: A resposta esperada seria a mesma? Se sim -> DUPLICATA.

    LISTA PARA ANÁLISE:
    ${csvData}

    SAÍDA (JSON ESTRITO):
    Retorne APENAS arrays de perguntas que passaram em todos os testes lógicos.
    Formato: [[{"id":1, "question":"..."}, {"id":5, "question":"..."}]]
    Se nenhuma passar, retorne [].
    `;

    // 3. Chamada API
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.0 // Zero criatividade, apenas lógica
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