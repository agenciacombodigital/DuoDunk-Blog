import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'

const MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { level, category, amount = 20 } = await req.json()
    
    if (!API_KEY) throw new Error('Chave GEMINI_API_KEY_QUIZ ausente.')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Credenciais Supabase ausentes.')

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. CORREÇÃO CRÍTICA: LER BANCO INTEIRO (Bypass limit 1000)
    console.log('[QuizGen] Lendo TODAS as perguntas existentes...');
    const { data: existingData } = await supabaseAdmin
      .from('milhao_questions')
      .select('question')
      .range(0, 9999); // Garante leitura de até 10k itens

    const forbiddenList = existingData?.map(q => q.question).join(" ### ") || "";
    console.log(`[QuizGen] Lista de exclusão: ${existingData?.length || 0} perguntas.`);

    // 2. PROMPTS REFINADOS (Separando Nível 1 de Nível 2)
    let promptContext = ""
    if (level === 1) {
        promptContext = `
        NÍVEL 1: INICIANTE / FÃ CASUAL (O ÓBVIO)
        - Perguntas sobre: LeBron, Curry, Jordan, Shaq, Kobe.
        - Apelidos mundiais (King James, Black Mamba).
        - Times muito famosos (Lakers, Bulls, Celtics).
        - Regras primárias (valor da cesta, tempo de jogo).
        `
    } 
    else if (level === 2) {
        promptContext = `
        NÍVEL 2: FÃ DE BASQUETE (CONHECIMENTO MÉDIO)
        - Recordes da temporada atual ou passada.
        - Campeões dos últimos 10 anos (detalhes).
        - Jogadores All-Star secundários (Jimmy Butler, Tatum, Booker).
        - Rivalidades com contexto.
        ⛔ PROIBIDO: Não pergunte apelidos óbvios ("Quem é o Greek Freak?" -> ISSO É NÍVEL 1). Não pergunte onde o Curry joga.
        `
    }
    else if (level === 3) {
        promptContext = `
        NÍVEL 3: HARDCORE / HISTORIADOR (ANOS 80/90/00)
        - Foco pesado em História: Eras Jordan, Bird/Magic, Shaq/Kobe.
        - Estatísticas específicas (quem fez mais assistências em 1995?).
        - Trocas que mudaram a liga.
        - Jogadores brasileiros "lado B" (Varejão, Nenê, Huertas).
        - Detalhes de regras (3 segundos defensivos, goaltending).
        `
    }
    else if (level === 4) {
        promptContext = `
        NÍVEL 4: ESPECIALISTA / IMPOSSÍVEL (DRAFTS E CURIOSIDADES)
        - Fatos obscuros da ABA.
        - "Busts" de Draft (quem foi escolhido antes do Jordan?).
        - Role players de times campeões (quem era o pivo reserva do Bulls em 96?).
        - Recordes negativos.
        - Curiosidades ultra-específicas.
        `
    }
    else {
        promptContext = "MISTO: Distribua entre 1 e 4."
    }

    const finalCategory = category || 'Variados';

    const prompt = `
      ATUE COMO UM ESPECIALISTA EM NBA.
      Gere um ARRAY JSON com ${amount} perguntas INÉDITAS.
      
      DIRETRIZES:
      ${promptContext}
      
      ⛔ ANTI-DUPLICIDADE (CRÍTICO):
      O banco JÁ TEM estas perguntas (separadas por ###):
      ${forbiddenList.substring(0, 900000)}
      
      REGRA 1: SE A PERGUNTA JÁ ESTÁ NA LISTA ACIMA, NÃO A GERE.
      REGRA 2: NÃO GERE PERGUNTAS SEMANTICAMENTE IDÊNTICAS.
      
      SAÍDA JSON:
      [
        {
          "level": ${level === 'mixed' ? '1-4' : level},
          "question": "Texto da pergunta...",
          "options": ["Certa", "Errada", "Errada", "Errada"],
          "correct_index": 0,
          "category": "${finalCategory}"
        }
      ]
    `

    // --- LÓGICA DE GERAÇÃO (COM RETRY) ---
    let successJson = null;
    let lastError = null;

    for (const currentModel of MODELS_TO_TRY) {
        try {
            console.log(`[QuizGen] Tentando: ${currentModel}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.9, // Alta criatividade para evitar repetições
                        maxOutputTokens: 8192,
                        responseMimeType: "application/json"
                    }
                })
            })

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erro API ${response.status}: ${errorBody}`);
            }

            const rawData = await response.json();
            let rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

            successJson = JSON.parse(rawText);
            if (Array.isArray(successJson) && successJson.length > 0) {
                console.log(`[QuizGen] Sucesso! ${successJson.length} perguntas novas.`);
                break;
            }
        } catch (e) {
            lastError = e;
            console.warn(`[QuizGen] Falha em ${currentModel}, tentando próximo...`);
            continue;
        }
    }

    if (!successJson) {
      throw new Error(`Falha na geração em todos os modelos. Último erro: ${lastError?.message}`);
    }

    return new Response(JSON.stringify(successJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[QuizGen] Fatal:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})