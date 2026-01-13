import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// Usando o modelo 1.5 Flash que é mais estável com cotas no momento, 
// se o 2.5 continuar dando erro 429, o 1.5 segura melhor.
const GEMINI_MODEL = "gemini-1.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    console.log("🚀 Iniciando Palpiteiro (Modo Lote/Batch)...");

    // 1. LIMPEZA DIÁRIA 
    // Garante que se rodar de novo, limpa os anteriores do dia para não duplicar
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    await supabase.from('daily_games').delete().gte('date', startOfDay);

    // 2. BUSCAR JOGOS (Scoreboard ESPN)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    console.log(`🏀 Jogos encontrados na ESPN: ${games.length}`);

    if (games.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum jogo na rodada hoje." }), { headers: { "Content-Type": "application/json" } });
    }

    // 3. PREPARAR O PROMPT EM LOTE (Batch Processing)
    // Cria uma string única com todos os jogos
    const gamesList = games.map((g: any) => {
      const home = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;
      
      const homeRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').records?.[0]?.summary || "";
      const awayRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').records?.[0]?.summary || "";
      
      return `- ID: "${g.id}" | ${home.displayName} (${homeRecord}) vs ${away.displayName} (${awayRecord})`;
    }).join('\n');

    const prompt = `
      Atue como o analista sênior de apostas da NBA (DuoDunk).
      
      TAREFA: Analise a lista de jogos abaixo e preveja o vencedor de CADA UM DELES.
      
      JOGOS DE HOJE:
      ${gamesList}

      REGRAS OBRIGATÓRIAS DE SAÍDA:
      1. Retorne APENAS um Array JSON puro. Sem markdown, sem aspas extras.
      2. Para CADA jogo, gere um objeto com: "id", "vencedor", "confianca" (número 0-100) e "analise".
      3. A "analise" deve ser curta (máx 150 caracteres), citando um fator chave (ex: lesão, mando de quadra, defesa).
      4. Seja decisivo. Diga quem vence.

      EXEMPLO DE RESPOSTA JSON:
      [
        { "id": "401810418", "vencedor": "Lakers", "confianca": 82, "analise": "LeBron aproveita a defesa fraca do adversário no garrafão." },
        { "id": "401810419", "vencedor": "Celtics", "confianca": 65, "analise": "Jogo equilibrado, mas o mando de quadra favorece Boston." }
      ]
    `;

    // 4. CHAMADA ÚNICA AO GEMINI (1 Requisição = Sem Erro 429)
    console.log("🤖 Enviando requisição única (Batch) para a IA...");
    
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         contents: [{ parts: [{ text: prompt }] }],
         generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error("Erro Gemini:", errorText);
        // Se der erro 429 aqui, é porque a conta está realmente bloqueada temporariamente
        throw new Error(`Erro Gemini API: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    let aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) throw new Error("IA não retornou texto.");

    // Limpeza do JSON
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const predictions = JSON.parse(aiResponseText);

    console.log(`✅ IA gerou ${predictions.length} palpites com sucesso.`);

    // 5. SALVAR NO BANCO DE DADOS
    const savedGames = [];

    for (const pred of predictions) {
      // Reencontra os dados originais do jogo para pegar nomes e logos corretos
      const originalGame = games.find((g: any) => g.id === pred.id);
      if (!originalGame) continue;

      const home = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;

      // Upsert do Jogo
      const { data: gameDb, error: gameError } = await supabase.from('daily_games').upsert({
        espn_game_id: pred.id,
        date: originalGame.date,
        home_team_id: home.id,
        home_team_name: home.displayName,
        // Fallback de logos padrão da ESPN
        home_team_logo: home.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${home.abbreviation?.toLowerCase()}.png`,
        visitor_team_id: away.id,
        visitor_team_name: away.displayName,
        visitor_team_logo: away.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${away.abbreviation?.toLowerCase()}.png`
      }, { onConflict: 'espn_game_id' }).select().single();

      if (gameError) {
          console.error(`Erro ao salvar jogo ${pred.id}:`, gameError);
          continue;
      }

      // Insert do Palpite
      if (gameDb) {
        await supabase.from('predictions').insert({
          game_id: gameDb.id,
          prediction_title: `${pred.vencedor} Vence`,
          prediction_analysis: pred.analise,
          confidence_score: pred.confianca,
          ai_model: GEMINI_MODEL
        });
        savedGames.push(pred.vencedor);
      }
    }

    return new Response(JSON.stringify({ success: true, count: savedGames.length, palpites: savedGames }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});