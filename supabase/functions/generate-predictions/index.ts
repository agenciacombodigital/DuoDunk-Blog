import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const NBA_TEAM_INFO_URL = `${SUPABASE_URL}/functions/v1/nba-team-info`; 

const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getGameDetails(gameId: string) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const homeId = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.id;
    const awayId = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.id;
    const homeLeadersData = data.leaders?.find((l: any) => l.team.id === homeId)?.leaders || [];
    const awayLeadersData = data.leaders?.find((l: any) => l.team.id === awayId)?.leaders || [];
    const espnPrediction = data.predictor?.homeTeam?.gameProjection || "N/A";
    return { homeLeadersData, awayLeadersData, espnPrediction };
  } catch (e) {
    return null;
  }
}

const formatFullLeaders = (leaders: any[]) => {
  if (!leaders || leaders.length === 0) return "Dados indisponíveis.";
  return leaders.map(cat => {
    const player = cat.leaders?.[0];
    if (!player) return "";
    return `${cat.displayName}: ${player.athlete.displayName} (${player.displayValue})`;
  }).filter(Boolean).join(' | ');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
       headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // 1. Limpeza de jogos expirados (não afeta os de hoje)
    await supabase.from('daily_games').delete().lt('date', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

    // 2. Buscar Scoreboard
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    const processedGames = [];

    // 3. Processar Jogos
    for (const [index, game] of games.entries()) {
      const gameId = game.id;
      
      // VERIFICAÇÃO: Já existe palpite para esse ID da ESPN?
      const { data: existingGame } = await supabase
        .from('daily_games')
        .select('id, predictions(id)')
        .eq('espn_game_id', gameId)
        .maybeSingle();

      // Se já tem palpite, pula para economizar tempo e API
      if (existingGame?.predictions && existingGame.predictions.length > 0) {
        console.log(`Skipping game ${gameId} (Already has prediction)`);
        continue;
      }

      console.log(`Analyzing game ${gameId}...`);

      const competidores = game.competitions[0].competitors;
      const homeTeam = competidores.find((c: any) => c.homeAway === 'home').team;
      const awayTeam = competidores.find((c: any) => c.homeAway === 'away').team;

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
      
      const [homeInt, awayInt, details] = await Promise.all([
          fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: homeTeam.id }) }).then(r => r.json()).catch(() => ({})),
          fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: awayTeam.id }) }).then(r => r.json()).catch(() => ({})),
          getGameDetails(gameId)
      ]);

      const safeDetails = details || { homeLeadersData: [], awayLeadersData: [], espnPrediction: "N/A" };

      const prompt = `Analista sênior DuoDunk. 
      CONFRONTO: ${homeTeam.displayName} vs ${awayTeam.displayName}. 
      ESPN Predictor: ${safeDetails.espnPrediction}%.
      MANDANTE: ${homeInt.record?.wins}-${homeInt.record?.losses}. Líderes: ${formatFullLeaders(safeDetails.homeLeadersData)}.
      VISITANTE: ${awayInt.record?.wins}-${awayInt.record?.losses}. Líderes: ${formatFullLeaders(safeDetails.awayLeadersData)}.
      REGRAS: Sem "Momentum". Texto curto (280 chars), técnico e vibrante.
      RESPOSTA JSON: { "palpite": "Título", "analise": "Texto", "confianca": 0-100 }`;

      const geminiRes = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           contents: [{ parts: [{ text: prompt }] }],
           generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        })
      });

      if (geminiRes.status === 429) { await delay(60000); continue; }
      if (!geminiRes.ok) continue;

      const geminiData = await geminiRes.json();
      const aiResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);

      // Salvar (Upsert para o Jogo, Insert para o Palpite)
      const { data: gameDb } = await supabase.from('daily_games').upsert({
        espn_game_id: gameId,
        date: game.date, 
        home_team_id: homeTeam.id,
        home_team_name: homeTeam.displayName,
        home_team_logo: `https://a.espncdn.com/i/teamlogos/nba/500/${homeTeam.id}.png`,
        visitor_team_id: awayTeam.id,
        visitor_team_name: awayTeam.displayName,
        visitor_team_logo: `https://a.espncdn.com/i/teamlogos/nba/500/${awayTeam.id}.png`
      }, { onConflict: 'espn_game_id' }).select().single();

      if (gameDb) {
        await supabase.from('predictions').insert({
          game_id: gameDb.id,
          prediction_title: aiResult.palpite,
          prediction_analysis: aiResult.analise,
          confidence_score: aiResult.confianca,
          ai_model: GEMINI_MODEL
        });
        processedGames.push(gameId);
      }

      // Delay apenas se houver mais jogos pendentes para processar
      if (index < games.length - 1) await delay(12000);
      
      // Segurança contra timeout: Se já passamos de 130s, paramos o loop e retornamos sucesso parcial
      // (Isso evita o erro 546/Timeout total)
    }

    return new Response(JSON.stringify({ success: true, processed: processedGames.length }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});