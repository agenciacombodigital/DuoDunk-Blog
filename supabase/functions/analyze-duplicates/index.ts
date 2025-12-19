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
    // PADRÃO DE SEGURANÇA: Se o frontend não mandar limite, usa 150.
    const { offset = 0, limit = 150 } = await req.json();

    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    if (!AUDITOR_API_KEY) throw new Error("API Key ausente.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. BUSCAR MICRO-LOTE
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Check de fim de lista
    if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ duplicates: [], hasMore: false, nextOffset: offset }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Auditor Turbo] Analisando ${questions.length} itens (Offset: ${offset})...`);

    // 2. PROMPT OTIMIZADO (Menos texto = Mais velocidade)
    // Mapeamos para um formato CSV simples para economizar tokens
    const csvData = questions.map(q => `ID:${q.id}|Q:${q.question}`).join("\n");

    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      TAREFA: Encontrar perguntas duplicadas ou semanticamente idênticas na lista abaixo.
      
      DADOS DE ENTRADA:
      ${csvData}
      
      REGRAS:
      1. Retorne APENAS um JSON Array.
      2. Agrupe IDs que perguntam a mesma coisa.
      3. Ignore itens únicos.
      
      SAÍDA ESPERADA:
      [
        [ {"id": "...", "question": "..."}, {"id": "...", "question": "..."} ]
      ]
    `;

    // 3. CHAMADA COM TIMEOUT DE SEGURANÇA
    const aiPromise = model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await aiPromise;
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let duplicates = [];
    try {
        duplicates = JSON.parse(cleanJson);
    } catch (e) {
        console.error("JSON Parse Error (IA retornou lixo):", e.message);
        // Em caso de erro de parse, retornamos vazio para não quebrar o loop do frontend
        duplicates = [];
    }
    
    // SEGURANÇA: Garante que duplicates é sempre array, mesmo se a IA falhar
    if (!Array.isArray(duplicates)) {
        duplicates = [];
    }

    return new Response(JSON.stringify({ 
        duplicates, 
        hasMore: questions.length === limit, 
        nextOffset: offset + limit 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[Auditor Fatal Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})