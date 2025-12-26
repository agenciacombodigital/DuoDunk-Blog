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
    // Mantendo 50 para garantir que a IA leia tudo com atenção
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

    const csvData = questions.map(q => `ID: ${q.id} | PERGUNTA: ${q.question}`).join("\n");
    
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    // Usando Flash-Lite mas com temperatura ZERO absoluto
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    // --- PROMPT DE VALIDAÇÃO POR RESPOSTA (Anti-Alucinação) ---
    const prompt = `
    VOCÊ É UM ROBÔ DE LÓGICA BOOLEANA. SUA MISSÃO É ENCONTRAR REDUNDÂNCIAS EXATAS.
    
    PARA CADA PAR DE PERGUNTAS, FAÇA O TESTE DA RESPOSTA:
    1. Imagine a resposta correta para a Pergunta A.
    2. Imagine a resposta correta para a Pergunta B.
    3. Se Resposta A != Resposta B, ENTÃO ELAS SÃO DIFERENTES. DESCARTE IMEDIATAMENTE.

    ❌ EXEMPLOS DE FALSOS POSITIVOS (NÃO AGRUPAR):
    - "Qual time draftou Kevin Love?" (Grizzlies) vs "Qual time draftou Kevin Garnett?" (Timberwolves) -> DIFERENTES.
    - "Mascote do Jazz" (Bear) vs "Mascote do Celtics" (Lucky) -> DIFERENTES.
    - "Recorde de tocos anos 90" (Hakeem) vs "Recorde de tocos carreira" (Hakeem) -> PARECIDAS, MAS DIFERENTES (Contexto de tempo).
    - "Quem é o Greek Freak?" (Giannis) vs "Posição do draft do Giannis?" (15th) -> DIFERENTES (Uma pede nome, outra pede número).

    ✅ ÚNICO CASO DE DUPLICATA ACEITO:
    - P1: "Quem ganhou o MVP de 2016?" (Curry)
    - P2: "Qual jogador foi eleito o Most Valuable Player da temporada 15-16?" (Curry)
    -> IGUAIS (Mesma resposta, mesmo fato gerador).

    LISTA DE ENTRADA:
    ${csvData}

    SAÍDA JSON APENAS:
    Retorne um Array de Arrays contendo APENAS os objetos completos das perguntas que são IDÊNTICAS em significado.
    Exemplo: [[{"id":1, "question":"..."}, {"id":5, "question":"..."}]]
    Se não houver certeza absoluta de 100%, retorne [].
    `;

    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            // @ts-ignore
            responseMimeType: "application/json",
            temperature: 0.0 // Criatividade ZERO é essencial aqui
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