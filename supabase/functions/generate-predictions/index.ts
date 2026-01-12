import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    console.log("🚀 Iniciando Palpiteiro Batch...");

    // 1. LIMPEZA DIÁRIA (Garante que rodará limpo no Cron Job da manhã)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    await supabase.from('daily_games').delete().gte('date', startOfDay);

    // 2. BUSCAR JOGOS (Scoreboard ESPN)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    console.log(`🏀 Jogos encontrados: ${games.length}`);

    if (games.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum jogo na rodada hoje." }), { headers: { "Content-Type": "application/json" } });
    }

    // 3. PREPARAR O PROMPT EM LOTE (Batch Processing)
    const gamesList = games.map((g: any) => {
      const home = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;
      const homeRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').records?.[0]?.summary || "";
      const awayRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').records?.[0]?.summary || "";
      
      return `- ID: "${g.id}" | JOGO: ${home.displayName} (${homeRecord}) vs ${away.displayName} (${awayRecord})`;
    }).join('\n');

    const prompt = `
      Atue como analista sênior de apostas da NBA (DuoDunk).
      
      Sua tarefa é analisar a rodada completa de hoje e prever o vencedor de TODOS os jogos.
      
      LISTA DE JOGOS:
      ${gamesList}

      REGRAS DE SAÍDA:
      1. Retorne APENAS um Array JSON válido.
      2. Para CADA jogo da lista, gere um objeto com: "id", "vencedor", "confianca" (0-100) e "analise".
      3. A "analise" deve ser uma frase curta e técnica justificando a vitória (ex: "Suns vence aproveitando a defesa fraca do adversário no garrafão").
      4. Seja decisivo. Não use "pode vencer", diga quem vence.

      FORMATO JSON ESPERADO:
      [
        { "id": "401810418", "vencedor": "Lakers", "confianca": 82, "analise": "LeBron lidera o ataque contra uma defesa desfalcada." },
        ... (repita para todos os jogos)
      ]
    `;

    // 4. CHAMADA ÚNICA AO GEMINI (Rápida e sem Timeout)
    console.log("🤖 Enviando batch para IA...");
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         contents: [{ parts: [{ text: prompt }] }],
         generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });

    if (!geminiRes.ok) {
        throw new Error(`Erro Gemini: ${geminiRes.status} - ${await geminiRes.text()}`);
    }

    const geminiData = await geminiRes.json();
    const aiResponseText = geminiData.candidates[0].content.parts[0].text;
    
    const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const predictions = JSON.parse(cleanJson);

    console.log(`✅ IA gerou ${predictions.length} palpites.`);

    // 5. SALVAR NO BANCO
    const savedGames = [];

    for (const pred of predictions) {
      const originalGame = games.find((g: any) => g.id === pred.id);
      if (!originalGame) continue;

      const home = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;

      const { data: gameDb, error: gameError } = await supabase.from('daily_games').upsert({
        espn_game_id: pred.id,
        date: originalGame.date,
        home_team_id: home.id,
        home_team_name: home.displayName,
        home_team_logo: home.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${home.abbreviation?.toLowerCase()}.png`,
        visitor_team_id: away.id,
        visitor_team_name: away.displayName,
        visitor_team_logo: away.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${away.abbreviation?.toLowerCase()}.png`
      }, { onConflict: 'espn_game_id' }).select().single();

      if (gameError) {
          console.error(`Erro ao salvar jogo ${pred.id}:`, gameError);
          continue;
      }

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