import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { offset = 0, limit = 100 } = await req.json(); // REDUZIDO PARA 100

    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    if (!AUDITOR_API_KEY) throw new Error("API Key ausente.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. BUSCAR DADOS
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .order('id', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Fim da lista ou lista vazia
    if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ duplicates: [], hasMore: false, nextOffset: offset }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Auditor] Analisando ${questions.length} itens (Offset: ${offset})...`);

    // 2. PROMPT ULTRA-SIMPLIFICADO (Para velocidade máxima)
    const csvData = questions.map(q => `${q.id}|${q.question}`).join("\n");
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    Analise esta lista de perguntas (ID|Texto).
    Retorne um JSON Array agrupando IDs de perguntas que são IDÊNTICAS ou MUITO SIMILARES (mesmo sentido).
    Ignore perguntas únicas.
    
    LISTA:
    ${csvData}
    
    SAÍDA JSON:
    [ [ {"id": "1", "question": "a"}, {"id": "2", "question": "b"} ] ]
    `;

    // 3. CHAMADA API
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    let duplicates = [];
    
    try {
        // Limpeza agressiva para garantir JSON
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        duplicates = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro Parse JSON IA:", e.message);
        duplicates = []; // Falha segura: retorna vazio em vez de quebrar
    }

    if (!Array.isArray(duplicates)) duplicates = [];

    return new Response(JSON.stringify({ 
        duplicates, 
        hasMore: questions.length === limit, 
        nextOffset: offset + limit 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[Fatal Error]:", error.message);
    // FALLBACK DE SEGURANÇA: Retorna JSON válido vazio em caso de erro fatal
    // Isso impede o frontend de travar (Tela branca/React Error)
    return new Response(JSON.stringify({ 
        duplicates: [], 
        hasMore: false, 
        error: error.message 
    }), { 
        status: 200, // Retorna 200 para o frontend processar o erro graciosamente
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})