import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4'

// 1. MODELO ÚNICO E ATUALIZADO (Gemini 2.5 Flash)
const MODELS_TO_TRY = ["gemini-2.5-flash"];
const API_KEY = Deno.env.get('GEMINI_API_KEY_QUIZ')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 2. SISTEMA DE SUB-TEMAS (Garante que o Quiz nunca fique repetitivo)
const SUB_THEMES = {
    1: [
        "Mascotes e Cores dos Times", "Apelidos famosos", "Cidades e Arenas", 
        "Regras básicas (Pontuação)", "Logotipos", "Estrelas Atuais (Curry, LeBron)",
        "Filmes de Basquete e Cultura Pop"
    ],
    2: [
        "Campeões da NBA (2010-2024)", "Recordes de 3 pontos", "Técnicos lendários",
        "Duplas famosas (Shaq & Kobe)", "All-Star Game recentes", "Premiações (MVP, Rookie)",
        "Jogadores Internacionais (Jokic, Giannis, Luka)"
    ],
    3: [
        "Drafts históricos (Quem foi pick #1?)", "Estatísticas defensivas (Tocos/Roubos)",
        "Jogadores 'Role Players' anos 90/00", "Franquias extintas (Sonics, Bullets)", 
        "Finais específicas (Jogos 7)", "Trocas polêmicas"
    ],
    4: [
        "Regras obscuras e Violações", "Jogadores da ABA", "Estatísticas avançadas (PER, Win Shares)",
        "Busts do Draft (Escolhas erradas)", "Universidades de origem (College)",
        "Detalhes de uniformes antigos e numeração de camisas"
    ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { level, category, amount = 10 } = await req.json()
    
    if (!API_KEY) throw new Error('Chave GEMINI_API_KEY_QUIZ ausente.')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Credenciais Supabase ausentes.')

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 3. LEITURA INTELIGENTE DO BANCO
    // Lê apenas as últimas 2000 perguntas do NÍVEL ATUAL para economizar contexto
    console.log(`[QuizGen] Lendo memória do banco para Nível ${level}...`);
    let query = supabaseAdmin.from('milhao_questions').select('question');
    
    if (typeof level === 'number') {
        query = query.eq('level', level); 
    }
    
    const { data: existingData } = await query
        .order('created_at', { ascending: false }) 
        .limit(2000); 

    // Cria a lista de exclusão (Anti-Repetição)
    const forbiddenList = existingData?.map(q => q.question.replace(/[?.!]/g, '')).join(" | ") || "";

    // 4. SORTEIO DO SUB-TEMA (A Lógica "Secreta")
    let selectedSubTheme = "Geral";
    let promptContext = "";

    if (typeof level === 'number' && SUB_THEMES[level]) {
        const themes = SUB_THEMES[level];
        selectedSubTheme = themes[Math.floor(Math.random() * themes.length)];
        console.log(`[QuizGen] Tema Secreto Sorteado: ${selectedSubTheme}`);
    }

    // Configuração de Dificuldade
    if (level === 1) {
        promptContext = `NÍVEL 1 (INICIANTE): Foco total em '${selectedSubTheme}'. Perguntas curtas e fatos muito conhecidos.`;
    } else if (level === 2) {
        promptContext = `NÍVEL 2 (MÉDIO): Foco total em '${selectedSubTheme}'. Saia do óbvio, mas mantenha acessível para quem acompanha a liga semanalmente.`;
    } else if (level === 3) {
        promptContext = `NÍVEL 3 (DIFÍCIL): Foco total em '${selectedSubTheme}'. Exija memória de anos específicos, placares ou estatísticas exatas.`;
    } else if (level === 4) {
        promptContext = `NÍVEL 4 (INSANO): Foco total em '${selectedSubTheme}'. Perguntas para especialistas e historiadores. Detalhes de rodapé.`;
    } else {
        promptContext = "MISTO: Gere uma mistura equilibrada.";
    }

    const finalCategory = category || 'Geral';

    const prompt = `
      ATUE COMO O "NBA QUIZMASTER PRO" (ENGINE GEMINI 2.5).
      Sua missão é gerar um ARRAY JSON com ${amount} perguntas INÉDITAS.
      
      🎯 TEMA SECRETO DA RODADA: ${selectedSubTheme.toUpperCase()}
      DIFICULDADE: ${promptContext}
      
      🛡️ ANTI-DUPLICIDADE (LISTA NEGRA):
      Você está estritamente PROIBIDO de criar perguntas sobre os mesmos fatos listados abaixo:
      ${forbiddenList.substring(0, 30000)}

      ⚡ REGRAS PARA OPÇÕES (DISTRATORES - IMPORTANTE PARA CASAS DE APOSTA):
      1. As opções erradas DEVEM ser plausíveis (pegadinhas inteligentes).
      2. Datas devem ser próximas (Ex: Se a resposta é 1996, use 1995, 1998 e não 2020).
      3. Jogadores devem ser da mesma posição, time ou era.
      4. NUNCA coloque a resposta certa sempre na mesma posição (A), varie o índice correto.
      
      FORMATO JSON OBRIGATÓRIO:
      [
        {
          "level": ${typeof level === 'number' ? level : '1-4'},
          "question": "Texto da pergunta em PT-BR...",
          "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
          "correct_index": 0,
          "category": "${finalCategory}",
          "explanation": "Frase curta explicando a resposta (curiosidade pós-jogo)."
        }
      ]
      *IMPORTANTE: O campo 'correct_index' (0 a 3) deve apontar para a resposta correta dentro do array 'options'.*
    `

    // --- LÓGICA DE GERAÇÃO (GEMINI 2.5 FLASH) ---
    let successJson = null;
    let lastError = null;

    for (const currentModel of MODELS_TO_TRY) {
        try {
            console.log(`[QuizGen] Solicitando geração via ${currentModel}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 1.0, // Criatividade alta para respeitar o sub-tema e não repetir
                        responseMimeType: "application/json"
                    }
                })
            })

            if (!response.ok) {
                 const errText = await response.text();
                 throw new Error(`Erro API ${response.status}: ${errText}`);
            }

            const rawData = await response.json();
            let rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            
            // Limpeza de Markdown caso o modelo insira ```json
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            successJson = JSON.parse(rawText);
            
            if (Array.isArray(successJson) && successJson.length > 0) break;

        } catch (e) {
            lastError = e;
            console.warn(`[QuizGen] Falha no modelo ${currentModel}: ${e.message}`);
            continue; // Se houver outro modelo na lista (backup), ele tenta. Senão, sai.
        }
    }

    if (!successJson) throw new Error(`Falha crítica na geração. Erro: ${lastError?.message}`);

    return new Response(JSON.stringify(successJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})