import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

// LISTA DE MODELOS VÁLIDOS (Prioridade: 2.5 Flash -> Lite -> 2.0 Exp)
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

    // --- MATRIZ DE CONTEÚDO (ESTRUTURA FINAL) ---
    let promptContext = ""
    
    if (level === 1) {
        promptContext = `
        NÍVEL 1: FATOS ÓBVIOS E POPULARES (Casual Fan).
        TEMAS OBRIGATÓRIOS:
        - Lendas Históricas: Jordan, LeBron, Kobe, Magic, Bird, Shaq.
        - Superstars Atuais: Curry, Durant, Giannis, Jokic, Luka, Tatum.
        - Regras Básicas: Quantos jogadores, valor da cesta, duração.
        - Times/Cidades: Onde joga o Lakers, Bulls, etc.
        - Recordes Populares: Quem tem mais títulos, maior pontuador.
        - Apelidos Óbvios: King James, Chef Curry.
        `
    } 
    else if (level === 2) {
        promptContext = `
        NÍVEL 2: CONHECIMENTO DE FÃ (NBA Fan).
        TEMAS OBRIGATÓRIOS:
        - História Recente: Campeões da última década, MVPs recentes.
        - Cultura Pop/Memes: Drake (Raptors), Spike Lee (Knicks), Space Jam.
        - Brasileiros Famosos: Nenê, Leandrinho, Varejão, Splitter.
        - Apelidos Clássicos: The Truth, The Big Ticket, The Claw.
        - Arenas e Franquias: Curiosidades sobre estádios conhecidos.
        `
    }
    else if (level === 3) {
        promptContext = `
        NÍVEL 3: HARDCORE (NBA Historian).
        TEMAS OBRIGATÓRIOS:
        - Eras Clássicas: Anos 60 (Celtics/Wilt), 80 (Bad Boys), 90 (Hakeem/Stockton).
        - Jogadas Históricas: The Shot, The Block, Ray Allen 2013.
        - Estatísticas Específicas: Triplo-duplos, recordes de playoffs.
        - Brasileiros "Lado B": Marcelinho Huertas, Raulzinho, Felício.
        - Documentários/Filmes: The Last Dance, He Got Game, Coach Carter.
        - Trocas Famosas e Curiosidades de Bastidores.
        `
    }
    else if (level === 4) {
        promptContext = `
        NÍVEL 4: ESPECIALISTA/MILHÃO (NBA Encyclopedia).
        TEMAS OBRIGATÓRIOS:
        - História Obscura: ABA (fusão, times extintos), Drafts antigos (busts).
        - Role Players: Jogadores de rotação que decidiram títulos.
        - Regras Antigas: Mudanças de regras obscuras, casos judiciais.
        - Estatísticas Raras: Recordes negativos, curiosidades ultra-específicas.
        - Jogadores Internacionais Raros: Histórias únicas de estrangeiros.
        `
    }
    else {
        promptContext = "MISTO: Gere uma seleção equilibrada cobrindo dos Níveis 1 ao 4."
    }

    const prompt = `
      ATUE COMO UM ESPECIALISTA SUPREMO EM NBA.
      Gere um ARRAY JSON com 50 perguntas de quiz em Português do Brasil (PT-BR).
      
      DIRETRIZES DE CONTEÚDO:
      ${promptContext}
      
      REGRAS CRÍTICAS:
      1. Use Português do Brasil (Ex: "Time" e não "Equipa", "Toco", "Cesta").
      2. NÃO repita perguntas óbvias ou recentes da mesma sessão.
      3. Varie os times e as eras (não foque apenas em Lakers/Celtics).
      
      FORMATO DE SAÍDA (JSON PURO):
      [
        {
          "level": ${level === 'mixed' ? '1-4' : level},
          "question": "Pergunta...",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "category": "Categoria (ex: História, Recordes, Cultura Pop)"
        }
      ]
    `

    let lastError = null;
    let successData = null;

    // --- ROTAÇÃO DE MODELOS (COM OS NOVOS GEMINI 2.5/2.0) ---
    for (const model of MODELS) {
      try {
        console.log(`[QuizGen] Tentando modelo: ${model}...`)
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.9, 
                maxOutputTokens: 8192,
                responseMimeType: "application/json" // FORÇA JSON VÁLIDO
            }
          })
        })

        if (!response.ok) {
          const errorBody = await response.text();
          // Erros de servidor (5xx) ou Cota (429) acionam o próximo modelo
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`Erro ${response.status} (${model}): ${errorBody}`);
          }
          throw new Error(`Erro Fatal ${response.status}: ${errorBody}`);
        }

        successData = await response.json();
        console.log(`[QuizGen] Sucesso com o modelo: ${model}`);
        break; // Sucesso! Sai do loop.

      } catch (error: any) {
        console.warn(`[QuizGen] Falha no modelo ${model}: ${error.message}`);
        lastError = error;
      }
    }

    if (!successData) {
      throw new Error(`Todos os modelos falharam. Último erro: ${lastError?.message}`);
    }

    // Processamento Final
    let rawText = successData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    rawText = rawText.trim();

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