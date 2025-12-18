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
    // Recebe os parâmetros de paginação do Frontend
    const { offset = 0, limit = 500 } = await req.json();

    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    if (!AUDITOR_API_KEY) throw new Error("API Key não encontrada.");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);

    // 1. BUSCAR APENAS O LOTE ATUAL (ex: 0 a 499)
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .order('id', { ascending: true }) // Ordena para garantir consistência na paginação
        .range(offset, offset + limit - 1); // Lógica de paginação

    if (error) throw error;
    
    // Se não vier nada, avisa que acabou
    if (!questions || questions.length === 0) {
        return new Response(JSON.stringify({ duplicates: [], hasMore: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    console.log(`[Auditor] Processando lote: ${offset} até ${offset + questions.length} (${questions.length} itens)...`);

    // 2. PREPARAR PROMPT PARA ESTE LOTE
    const csvData = questions.map(q => `${q.id}|${q.question}`).join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      ATUE COMO UM AUDITOR DE DADOS RIGOROSO.
      Analise esta lista de ${questions.length} perguntas do Quiz NBA.
      
      OBJETIVO:
      Encontre perguntas que são SEMANTICAMENTE IDÊNTICAS (perguntam a mesma coisa) dentro desta lista.

      DADOS (ID|PERGUNTA):
      --- INÍCIO ---
      ${csvData}
      --- FIM ---

      REGRAS DE SAÍDA:
      1. Retorne APENAS um Array JSON com os grupos de conflito.
      2. Ignore perguntas únicas.
      
      EXEMPLO DE SAÍDA:
      [
        [ {"id": "uuid-1", "question": "..."}, {"id": "uuid-2", "question": "..."} ]
      ]
    `;

    // 3. CHAMAR API (Agora é rápido porque o payload é menor)
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });
    
    const responseText = result.response.text();
    
    // Limpeza de segurança
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let duplicates = [];
    try {
        duplicates = JSON.parse(cleanJson);
    } catch (e) {
        console.error("Erro ao parsear JSON da IA:", e);
        // Retorna um array vazio se o parse falhar
    }

    return new Response(JSON.stringify({ 
        duplicates, 
        hasMore: questions.length === limit, // Avisa o frontend se tem mais páginas
        nextOffset: offset + limit 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[Erro Auditor]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})