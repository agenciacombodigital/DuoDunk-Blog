import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

// ROTAÇÃO DE MODELOS (Prioridade: Estabilidade -> Novidade)
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

    // --- MATRIZ DE CONTEÚDO (Balanço entre Fã e Especialista) ---
    let context = ""
    if (level === 1) {
        context = `NÍVEL 1 (CASUAL): Foco em Lendas (Jordan/LeBron), Cores, Mascotes, Cidades e Regras Básicas.`
    } else if (level === 2) {
        context = `NÍVEL 2 (FÃ): Foco em Campeões Recentes, Apelidos, Recordes Simples, Cultura Pop (Space Jam/Drake).`
    } else if (level === 3) {
        context = `NÍVEL 3 (HARDCORE): Foco em História 80s/90s, Drafts, Estatísticas, Jogadas Históricas.`
    } else if (level === 4) {
        context = `NÍVEL 4 (MILHÃO): Foco em Recordes Obscuros, ABA, Role Players, Curiosidades Extremas.`
    } else {
        context = `MISTO: Distribua equilibradamente entre Nível 1 e 4.`
    }

    const QTD = 25; // Reduzido para evitar corte de JSON

    const prompt = `
      ATUE COMO UM ESPECIALISTA SUPREMO EM NBA.
      Gere um ARRAY JSON com ${QTD} perguntas de quiz em Português do Brasil (PT-BR).
      CONTEXTO: ${context}
      
      REGRAS CRÍTICAS:
      1. Use Português do Brasil (Ex: "Time", "Toco").
      2. NÃO repita perguntas óbvias nesta sessão.
      3. Varie eras e times.
      
      FORMATO JSON PURO:
      [
        {"level": ${level === 'mixed' ? '1-4' : level}, "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "category": "..."}
      ]
    `

    let successJson = null;
    let lastError = null;

    // LOOP DE ROTAÇÃO
    for (const model of MODELS) {
      try {
        console.log(`[QuizGen] Tentando ${model}...`)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.9, // Alta criatividade
                maxOutputTokens: 8192,
                responseMimeType: "application/json" 
            }
          })
        })

        if (!response.ok) {
            const err = await response.text();
            if (response.status >= 500 || response.status === 429) throw new Error(`Erro ${response.status}: ${err}`);
            throw new Error(`Erro Fatal: ${err}`);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        
        try {
            successJson = JSON.parse(rawText.trim());
            if (Array.isArray(successJson)) break; // Sucesso!
        } catch (e) {
            throw new Error("JSON Inválido recebido da IA.");
        }

      } catch (error: any) {
        console.warn(`Falha no modelo ${model}: ${error.message}`);
        lastError = error;
      }
    }

    if (!successJson) throw new Error(`Falha total. Último erro: ${lastError?.message}`);

    return new Response(JSON.stringify(successJson), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})