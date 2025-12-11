import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { level } = await req.json()
    
    if (!API_KEY) {
      throw new Error('Chave GEMINI_API_KEY_QUIZ não configurada no servidor.')
    }

    let promptContext = ""
    if (level === 1) promptContext = "NÍVEL 1 (FÁCIL). Foco: Cores, Mascotes, Lendas (Jordan/LeBron), Regras Básicas."
    else if (level === 2) promptContext = "NÍVEL 2 (MÉDIO). Foco: Campeões recentes, Apelidos famosos, Recordes simples."
    else if (level === 3) promptContext = "NÍVEL 3 (DIFÍCIL). Foco: História anos 90, Drafts, Estatísticas específicas."
    else if (level === 4) promptContext = "NÍVEL 4 (MILHÃO/EXPERT). Foco: Recordes obscuros, História da ABA, Curiosidades extremas."
    else promptContext = "MISTO. Varie os níveis de 1 a 4."

    const prompt = `
      ATUE COMO ESPECIALISTA EM NBA.
      Gere um ARRAY JSON com 50 perguntas de quiz em Português do Brasil (PT-BR).
      ${promptContext}
      
      FORMATO ESTRITO (JSON ONLY):
      [
        {
          "level": ${level === 'mixed' ? '1-4' : level},
          "question": "Texto da pergunta",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "category": "Categoria curta"
        }
      ]
      REGRA: Sem markdown. Sem vírgula no final da lista.
    `

    console.log(`[QuizGen] Usando modelo gemini-2.5-flash para nível ${level}...`)

    // --- USANDO O MODELO CORRETO (2.5 Flash) ---
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
            temperature: 0.9,
            maxOutputTokens: 8192
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[QuizGen] Erro Google ${response.status}:`, errorText)
      throw new Error(`Erro na API do Google (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    
    // Limpeza
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    rawText = rawText.replace(/,\s*\]/g, ']')

    return new Response(rawText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("[QuizGen] Erro Interno:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})