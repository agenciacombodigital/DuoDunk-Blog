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
    // 1. CONFIGURAÇÃO DE CHAVE DEDICADA (Evita Rate Limit na chave do Quiz)
    // O sistema vai procurar primeiro por uma chave específica de auditoria
    const AUDITOR_API_KEY = Deno.env.get('GEMINI_API_KEY_AUDITOR') || Deno.env.get('GEMINI_API_KEY_QUIZ');
    
    if (!AUDITOR_API_KEY) throw new Error("Nenhuma API Key encontrada (nem Auditor, nem Geral).");

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const genAI = new GoogleGenerativeAI(AUDITOR_API_KEY);

    // 2. BUSCAR TODAS AS PERGUNTAS (Range 0-9999)
    // Trazemos apenas ID e Pergunta para economizar banda
    const { data: questions, error } = await supabase
        .from('milhao_questions')
        .select('id, question')
        .range(0, 9999);

    if (error) throw error;
    if (!questions || questions.length === 0) throw new Error("Banco de dados vazio.");

    console.log(`[Auditor] Analisando ${questions.length} perguntas...`);

    // 3. PREPARAR O PROMPT GIGANTE
    // Formatamos como CSV simplificado: ID|PERGUNTA
    const csvData = questions.map(q => `${q.id}|${q.question}`).join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      ATUE COMO UM AUDITOR DE DADOS RIGOROSO.
      Analise a lista abaixo contendo ${questions.length} perguntas de um Quiz sobre NBA.
      
      OBJETIVO:
      Encontre perguntas que são DUPLICATAS SEMÂNTICAS (perguntam a mesma coisa com palavras diferentes) ou DUPLICATAS EXATAS.

      DADOS (Formato: ID|PERGUNTA):
      --- INÍCIO DOS DADOS ---
      ${csvData}
      --- FIM DOS DADOS ---

      REGRAS DE SAÍDA:
      1. Retorne APENAS um JSON.
      2. O JSON deve ser uma lista de grupos de conflito.
      3. Ignore perguntas únicas. Liste apenas as que têm "irmãs gêmeas".
      
      EXEMPLO DE FORMATO DE RESPOSTA:
      [
        [
            {"id": "uuid-105", "question": "Quem é o King James?"},
            {"id": "uuid-204", "question": "Qual é o apelido de LeBron James?"}
        ],
        [
            {"id": "uuid-50", "question": "Quantos pontos vale lance livre?"},
            {"id": "uuid-51", "question": "Lance livre vale quanto?"}
        ]
      ]
    `;

    // 4. CHAMADA À API (Pode demorar alguns segundos devido ao tamanho)
    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    
    // Limpeza de segurança
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const duplicates = JSON.parse(cleanJson);

    return new Response(JSON.stringify(duplicates), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[Auditor Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})