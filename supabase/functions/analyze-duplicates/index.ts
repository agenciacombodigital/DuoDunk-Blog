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
    // Forçamos o limit para 100 para garantir performance rápida (< 10s)
    const { offset = 0, limit = 100 } = await req.json();

    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    if (!AUDITOR_API_KEY) throw new Error("API Key ausente.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Busca Lote Pequeno
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Se acabou, retorna sinal de fim
    if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ duplicates: [], hasMore: false, nextOffset: offset }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Auditor] Processando ${questions.length} itens (Offset: ${offset})...`);

    // 2. Prompt Ultra-Curto para Economizar Tokens e Tempo
    const csvData = questions.map(q => `${q.id}|${q.question}`).join("\n");
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Tarefa: Agrupar perguntas DUPLICADAS (semântica idêntica) nesta lista.
    Entrada: ID|Texto
    ${csvData}
    Saída: JSON Array de arrays (apenas IDs duplicados). Ex: [[{"id":1, "question":"a"}, {"id":5, "question":"a"}]]
    Se nenhuma duplicata, retorne [].
    `;

    // 3. Chamada API
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });

    let duplicates = [];
    try {
        // Limpeza agressiva para garantir JSON
        const cleanJson = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        duplicates = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro Parse JSON IA:", e.message);
        duplicates = []; // Falha silenciosa segura
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
    // Retorna 200 com erro no corpo para não quebrar o frontend
    return new Response(JSON.stringify({ error: error.message, duplicates: [], hasMore: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})