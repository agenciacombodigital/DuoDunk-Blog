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

    // 1. CORREÇÃO DE LEITURA (Range 0-9999)
    console.log('[QuizGen] Lendo memória completa do banco...');
    const { data: existingData } = await supabaseAdmin
      .from('milhao_questions')
      .select('question')
      .range(0, 9999); // <--- OBRIGATÓRIO PARA LER TUDO

    // Prepara a lista negra
    const forbiddenList = existingData?.map(q => q.question).join(" ### ") || "";
    console.log(`[QuizGen] ${existingData?.length || 0} perguntas carregadas para exclusão.`);

    // 2. PROMPTS REFINADOS (Separando Nível 1 de Nível 2)
    let promptContext = ""
    if (level === 1) {
        promptContext = `
        NÍVEL 1: INICIANTE (MAS SEJA CRIATIVO!)
        - Não fique só em "Quem é o King James". Varie!
        - Pergunte sobre: Mascotes (Benny the Bull), Cores (Quem usa Verde?), Cidades (Onde joga o Jazz?), Logotipos.
        - Apelidos e Lendas (Jordan, Shaq, Kobe).
        - Regras muito básicas (3 pontos, lance livre).
        `
    } else if (level === 2) {
        promptContext = `
        NÍVEL 2: FÃ MÉDIO (SAIA DO ÓBVIO)
        - NÃO PERGUNTE apelidos de nível 1 (Nada de "Quem é Black Mamba").
        - Foco: Recordes recentes, Campeões dos anos 2010s, Técnicos famosos (Phil Jackson, Popovich).
        - Jogadores All-Star (Tatum, Booker, Butler) - não apenas os GOATs.
        - Filmes (Space Jam, Air).
        `
    } else if (level === 3) {
        promptContext = `
        NÍVEL 3: HARDCORE (ANOS 90/00 E ESTATÍSTICAS)
        - Eras clássicas (Bird vs Magic, Bad Boys).
        - Estatísticas (quem tem mais assistências?).
        - Jogadores brasileiros secundários.
        - Trocas famosas.
        `
    } else if (level === 4) {
        promptContext = `
        NÍVEL 4: ESPECIALISTA (OBSCURO)
        - ABA, Busts de Draft, Regras antigas.
        - Curiosidades que ninguém sabe.
        `
    } else {
        promptContext = "MISTO: Distribua entre os níveis 1 a 4."
    }

    const finalCategory = category || 'Variados';

    const prompt = `
      ATUE COMO O "NBA QUIZMASTER PRO".
      Sua missão é gerar um ARRAY JSON com ${amount} perguntas INÉDITAS E ORIGINAIS.
      
      DIRETRIZES DE NÍVEL:
      ${promptContext}
      
      🔴 SISTEMA DE DEFESA CONTRA DUPLICIDADE (LEITURA OBRIGATÓRIA) 🔴
      
      O banco de dados JÁ CONTÉM as seguintes perguntas (Lista de Exclusão):
      --- INÍCIO DA MEMÓRIA ---
      ${forbiddenList.substring(0, 950000)}
      --- FIM DA MEMÓRIA ---

      ⚡ REGRAS DE OURO PARA NÃO REPETIR (SEMÂNTICA):
      Você está PROIBIDO de testar o mesmo FATO ou CURIOSIDADE que já está na lista acima, mesmo que mude as palavras.
      
      Exemplos de PROIBIÇÃO (Entenda o conceito):
      1. INVERSÃO: Se já existe "Quem ganhou em 2023?", NÃO crie "O Denver Nuggets ganhou em que ano?". É o mesmo fato.
      2. SINÔNIMOS: Se já existe "Qual o apelido de LeBron?", NÃO crie "Como LeBron é conhecido?".
      3. FOCO REPETIDO: Se já leu 5 perguntas sobre o Michael Jordan na lista acima, NÃO FAÇA MAIS NENHUMA sobre ele agora. Mude para outro jogador.

      ORDEM DE EXECUÇÃO:
      1. Leia a 'Lista de Exclusão' acima.
      2. Escolha um fato/curiosidade que NÃO esteja lá.
      3. Escreva a pergunta em Português Brasileiro natural.
      
      SAÍDA JSON PURO:
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

    // --- LÓGICA DE RETRY (Flash -> Lite) ---
    let successJson = null;
    let lastError = null;

    for (const currentModel of MODELS_TO_TRY) {
        try {
            console.log(`[QuizGen] Tentando ${currentModel}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 1.0, // Aumentei para 1.0 para forçar criatividade máxima
                        responseMimeType: "application/json"
                    }
                })
            })

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erro API ${response.status}: ${errorBody}`);
            }

            const rawData = await response.json();
            let rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            successJson = JSON.parse(rawText);
            if (Array.isArray(successJson) && successJson.length > 0) break;

        } catch (e) {
            lastError = e;
            console.warn(`[QuizGen] Falha ${currentModel}, tentando próximo...`);
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})