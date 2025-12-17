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

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. RECUPERAR "MEMÓRIA" COMPLETA (CORREÇÃO DE LIMITES)
    // O Supabase limita a 1000 rows por padrão. Usamos .range(0, 9999) para forçar a leitura de até 10.000.
    console.log('[QuizGen] Buscando memória completa do banco...');
    
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('milhao_questions')
      .select('question')
      .range(0, 9999); // <--- FORÇA LEITURA DE ATÉ 10 MIL PERGUNTAS

    if (fetchError) console.error('[QuizGen] Erro ao buscar histórico:', fetchError);

    // Cria a lista proibida, usando ' ### ' como separador para melhor parsing pela IA
    const forbiddenList = existingData?.map(q => q.question).join(" ### ") || "Nenhuma pergunta existente.";
    console.log(`[QuizGen] Memória carregada: ${existingData?.length || 0} perguntas proibidas.`);

    // --- REFINAMENTO ESTRITO DE NÍVEIS ---
    let promptContext = ""
    
    if (level === 1) {
        promptContext = `
        NÍVEL 1: INICIANTE / FÃ CASUAL (O ÓBVIO ULULANTE)
        Obrigatório: Perguntas que até quem não assiste NBA sabe responder.
        - Foco em: LeBron, Curry, Jordan, Shaq, Kobe.
        - Apelidos que são marcas mundiais (King James, CR7 do basquete).
        - Cores de times muito famosos (Lakers = Roxo/Dourado).
        - Regras primárias (bola na cesta vale quanto?).
        PROIBIDO: Perguntar sobre técnicos, jogadores secundários ou anos específicos.
        `
    } 
    else if (level === 2) {
        promptContext = `
        NÍVEL 2: FÃ DE BASQUETE (CONHECIMENTO GERAL)
        Obrigatório: Sair do óbvio. Perguntas para quem assiste aos jogos.
        - Recordes da temporada atual ou passada.
        - Campeões dos últimos 10 anos (não apenas "quem ganhou", mas detalhes).
        - Jogadores All-Star que não são "A Cara da Liga" (ex: Jimmy Butler, Donovan Mitchell).
        - Rivalidades (Celtics x Lakers, mas com contexto).
        - Filmes e Cultura Pop ligada à NBA.
        ⛔ PROIBIDO NO NÍVEL 2:
        - NÃO PERGUNTE apelidos óbvios como "The Greek Freak" ou "King James" (isso é nível 1).
        - NÃO PERGUNTE qual time o Curry joga (isso é nível 1).
        - O nível 2 deve exigir que a pessoa acompanhe a liga, não apenas conheça os logotipos.
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
        promptContext = "MISTO: Gere perguntas variadas respeitando estritamente a separação dos níveis acima."
    }

    const finalCategory = category || 'Variados';

    const prompt = `
      Você é o "NBA QuizMaster Pro". Sua tarefa é gerar um JSON com ${amount} perguntas INÉDITAS.
      
      DIRETRIZES DO NÍVEL SELECIONADO:
      ${promptContext}
      
      --- MEMÓRIA DE DUPLICIDADE (SISTEMA ANTI-REPETIÇÃO) ---
      O banco de dados JÁ POSSUI as seguintes perguntas (separadas por ###):
      ${forbiddenList.substring(0, 800000)} 
      // (Limitamos a string para garantir que caiba no prompt, mas 2.5 Flash aguenta muito)

      ⚡ REGRAS DE GERAÇÃO:
      1. CHECK DE DUPLICIDADE: Antes de escrever uma pergunta, verifique a lista acima. Se o assunto (ex: "Apelido do Giannis") já estiver lá, VOCÊ NÃO PODE USAR. Invente outra.
      2. SEMÂNTICA: Não mude apenas as palavras. "Quem é o Greek Freak?" e "Qual a alcunha de Giannis?" são a MESMA pergunta. Não gere.
      3. CRIATIVIDADE: Se o Nível 2 pede apelidos, e "Greek Freak" já existe, pergunte sobre o "Spida" (Donovan Mitchell) ou "The Claw" (Kawhi).
      4. IDIOMA: Português Brasileiro natural de narrador da ESPN/Amazon Prime.

      SAÍDA ESPERADA (JSON PURO):
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
                        responseMimeType: "application/json"
                    }
                })
            })

            if (!response.ok) throw new Error(`Erro API: ${response.status}`);

            const rawData = await response.json();
            let rawText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
            rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

            successJson = JSON.parse(rawText);
            if (Array.isArray(successJson) && successJson.length > 0) {
                console.log(`[QuizGen] Sucesso! ${successJson.length} perguntas novas.`);
                break;
            }
        } catch (e) {
            console.warn(`[QuizGen] Falha em ${currentModel}, tentando próximo...`);
            continue;
        }
    }

    if (!successJson) throw new Error("Falha na geração em todos os modelos.");

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