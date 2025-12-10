import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Usa a chave DEDICADA para o Quiz
const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { level } = await req.json()
    
    if (!API_KEY) throw new Error('Chave GEMINI_API_KEY_QUIZ não configurada.')

    // 1. Construção do Prompt no Backend (Mais seguro)
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
      [
        {
          "level": ${level === 'mixed' ? '1-4' : level},
          "question": "Texto da pergunta",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "category": "Categoria curta"
        }
      ]
      REGRA: Sem markdown. Sem vírgula final.
    `

    // 2. Chamada à API do Google (Server-Side)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Erro na API do Gemini')
    }

    const data = await response.json()
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    
    // 3. Limpeza e Sanitização
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
    // Correção de vírgulas trailing comuns
    rawText = rawText.replace(/,\s*\]/g, ']')

    return new Response(rawText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})