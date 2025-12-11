import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

// Lista de modelos para tentar em ordem de preferência
const MODELS = [
  "gemini-2.5-flash", 
  "gemini-2.5-flash-lite-preview-09-2025", 
  "gemini-2.0-flash-exp"
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { level } = await req.json()
    
    if (!API_KEY) throw new Error('Chave GEMINI_API_KEY_QUIZ não configurada.')

    // 1. Definição do Prompt (Mantida)
    let promptContext = ""
    if (level === 1) promptContext = "NÍVEL 1 (FÁCIL). Foco: Cores, Mascotes, Lendas, Regras."
    else if (level === 2) promptContext = "NÍVEL 2 (MÉDIO). Foco: Campeões recentes, Recordes simples."
    else if (level === 3) promptContext = "NÍVEL 3 (DIFÍCIL). Foco: História 90s, Drafts, Estatísticas."
    else if (level === 4) promptContext = "NÍVEL 4 (MILHÃO). Foco: Obscuro, ABA, Recordes negativos."
    else promptContext = "MISTO. Varie os níveis."

    const prompt = `
      ATUE COMO ESPECIALISTA EM NBA.
      Gere um ARRAY JSON com 50 perguntas de quiz em Português do Brasil (PT-BR).
      ${promptContext}
      FORMATO ESTRITO (JSON ONLY):
      [{"level": ${level === 'mixed' ? '1-4' : level}, "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "category": "..."}]
      REGRA: Sem markdown. Sem vírgula final.
    `

    let lastError = null;
    let successData = null;

    // 2. Loop de Tentativa (Rotação de Modelos)
    for (const model of MODELS) {
      try {
        console.log(`[QuizGen] Tentando modelo: ${model}...`)
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 8192 }
          })
        })

        if (!response.ok) {
          const errorBody = await response.text();
          // Se for erro de servidor (5xx) ou cota (429), lança para tentar o próximo
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`Erro ${response.status} no modelo ${model}: ${errorBody}`);
          }
          // Outros erros (400) são fatais (ex: prompt inválido), então paramos
          throw new Error(`Erro Fatal ${response.status}: ${errorBody}`);
        }

        successData = await response.json();
        console.log(`[QuizGen] Sucesso com o modelo: ${model}`);
        break; // Sucesso! Sai do loop.

      } catch (error: any) {
        console.warn(`[QuizGen] Falha no modelo ${model}: ${error.message}`);
        lastError = error;
        // Continua para o próximo modelo...
      }
    }

    if (!successData) {
      throw new Error(`Todos os modelos falharam. Último erro: ${lastError?.message}`);
    }

    // 3. Processamento
    let rawText = successData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    rawText = rawText.replace(/,\s*\]/g, ']')

    return new Response(rawText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[QuizGen] Erro Fatal:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})