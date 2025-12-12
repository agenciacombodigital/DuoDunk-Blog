import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')

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

    // --- MATRIZ DE CONTEÚDO COMPLETA (SEM RESUMOS) ---
    let promptContext = ""
    
    if (level === 1) {
        promptContext = `
        NÍVEL 1: FATOS ÓBVIOS, LENDAS FAMOSAS, JOGADORES POPULARES, REGRAS BÁSICAS
        Categorias Obrigatórias:
        - Lendas históricas conhecidas (Jordan, LeBron, Kobe, Magic, Bird, Shaq).
        - Superstars atuais e recentes (Curry, Durant, Giannis, Jokic, Luka, Embiid, Tatum).
        - Jogadores populares da atualidade (Shai, Harden, Westbrook, Kawhi, Anthony Davis).
        - Regras básicas do jogo (quantos jogadores, duração do jogo, pontos por arremesso).
        - Times famosos e suas cidades.
        - Recordes conhecidos e populares (mais pontos em um jogo, mais títulos, MVP).
        - Curiosidades populares sobre a NBA.
        - Apelidos óbvios de jogadores famosos (Chef Curry, Slim Reaper, The Greek Freak).
        `
    } 
    else if (level === 2) {
        promptContext = `
        NÍVEL 2: RECORDES CONHECIDOS, CAMPEÕES RECENTES, APELIDOS
        Categorias Obrigatórias:
        - Campeões da última década.
        - Apelidos famosos de jogadores (The King, Black Mamba, Greek Freak).
        - Recordes de equipes (sequências de vitórias, playoffs).
        - MVPs recentes e All-Stars.
        - Rivalidades históricas conhecidas.
        - Jogadores brasileiros na NBA (Nenê, Leandrinho, Tiago Splitter, Anderson Varejão).
        - Curiosidades sobre arenas e franquias.
        - Celebridades famosas ligadas à NBA (Drake e Raptors, Jay-Z e Nets, Spike Lee e Knicks).
        - Curiosidades engraçadas conhecidas (momentos virais, memes famosos).
        - Filmes famosos sobre NBA (Space Jam, Coach Carter, He Got Game).
        - Jogadores que atuaram em filmes conhecidos (LeBron, Shaq, Kareem).
        `
    }
    else if (level === 3) {
        promptContext = `
        NÍVEL 3: ESTATÍSTICAS ESPECÍFICAS, HISTÓRIA ANOS 60/70/80/90, TROCAS
        Categorias Obrigatórias:
        - Era anos 60 (Celtics de Russell, Wilt Chamberlain, Jerry West).
        - Era anos 70 (Kareem Abdul-Jabbar, rivalidades ABA-NBA, Dr. J).
        - Era anos 80 (Magic vs Bird, Lakers-Celtics, Bad Boys Pistons).
        - Era anos 90 (Jordan e Bulls, Hakeem e Rockets, Stockton e Malone).
        - Trocas históricas famosas.
        - Estatísticas específicas (triplo-duplos, eficiência).
        - Acontecimentos históricos marcantes (The Decision, Lakers-Celtics Finals).
        - Jogadas históricas famosas (último arremesso de Jordan, block do LeBron).
        - Jogos históricos (63 pontos do Jordan nos playoffs, 81 do Kobe, 100 do Wilt).
        - Regras que mudaram ao longo do tempo.
        - Jogadores brasileiros menos conhecidos (Marcelinho Huertas, Raul Neto, Cristiano Felício).
        - Celebridades com histórias específicas (Jack Nicholson presença nos jogos, fãs famosos).
        - Filmes e documentários específicos (The Last Dance, More Than a Game).
        - Participações específicas em filmes (Kareem em Airplane, Ray Allen em He Got Game).
        `
    }
    else if (level === 4) {
        promptContext = `
        NÍVEL 4: FATOS OBSCUROS, ROLE PLAYERS, ABA, DRAFTS ANTIGOS
        Categorias Obrigatórias:
        - História da ABA (fusão, jogadores, regras diferentes).
        - Role players importantes em conquistas.
        - Drafts antigos (picks surpreendentes, busts históricos).
        - Fatos obscuros e pouco conhecidos.
        - Regras antigas e modificações técnicas detalhadas.
        - Acontecimentos históricos obscuros (greves, mudanças de franquias, casos judiciais).
        - Jogadores de outras nacionalidades com histórias únicas e raras.
        - Estatísticas raras e recordes obscuros.
        - Detalhes técnicos de jogadas históricas menos conhecidas.
        - Curiosidades ultra-específicas que só fãs hardcore sabem.
        `
    }
    else {
        promptContext = "MISTO: Distribua equilibradamente entre todos os níveis acima (1 ao 4)."
    }

    // Lote seguro para evitar timeout
    const QTD_PERGUNTAS = 20; 

    const prompt = `
      ATUE COMO UM ESPECIALISTA SUPREMO EM NBA.
      Gere um ARRAY JSON com ${QTD_PERGUNTAS} perguntas de quiz em Português do Brasil (PT-BR).
      
      DIRETRIZES COMPLETAS DO NÍVEL:
      ${promptContext}
      
      REGRAS DE OURO (ANTI-REPETIÇÃO):
      1. DIVERSIDADE TOTAL: Em um lote de 20 perguntas, NUNCA repita o mesmo jogador ou time como foco principal mais de uma vez. (Ex: Se tiver uma pergunta sobre Curry, a próxima NÃO pode ser sobre ele ou o irmão dele).
      2. VARIEDADE DE TEMAS: Intercale obrigatoriamente: 1 pergunta de Regra, 1 de História, 1 de Recorde, 1 de Curiosidade, etc. Não agrupe assuntos.
      3. IDIOMA: Use termos brasileiros ("Cesta" e não "Ponto", "Garrafão" e não "Pintado").
      
      FORMATO DE SAÍDA (JSON PURO):
      [
        {
          "level": ${level === 'mixed' ? '1-4' : level},
          "question": "Pergunta...",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "category": "Categoria (ex: Draft, Cultura Pop)"
        }
      ]
    `

    let lastError = null;
    let successJson = null;

    // --- ROTAÇÃO DE MODELOS ---
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
                responseMimeType: "application/json" // OBRIGA JSON VÁLIDO
            }
          })
        })

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`Erro ${response.status} (${model}): ${errorBody}`);
          }
          throw new Error(`Erro Fatal ${response.status}: ${errorBody}`);
        }

        const rawData = await response.json();
        let rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
        
        // Limpeza de segurança (embora o responseMimeType já ajude muito)
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
        
        try {
            successJson = JSON.parse(rawText);
            if (!Array.isArray(successJson)) throw new Error("Não é um array.");
            console.log(`[QuizGen] Sucesso! Geradas ${successJson.length} perguntas.`);
            break; 
        } catch (e) {
            throw new Error(`JSON Inválido recebido: ${e.message}`);
        }

      } catch (error: any) {
        console.warn(`[QuizGen] Falha no modelo ${model}: ${error.message}`);
        lastError = error;
      }
    }

    if (!successJson) {
      throw new Error(`Falha em todos os modelos. Último erro: ${lastError?.message}`);
    }

    return new Response(JSON.stringify(successJson), {
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