import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const NBA_TEAM_INFO_URL = `https://brerfpcfkyptkzygyzxl.supabase.co/functions/v1/nba-team-info`; 

const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 1. Função de Delay (Pausa)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para formatar líderes (Stats)
const formatLeaders = (leaders: any[]) => {
  if (!leaders || !Array.isArray(leaders) || leaders.length === 0) return "Sem dados de líderes.";
  return leaders.map(l => `${l.displayName}: ${l.value} (${l.shortDisplayName})`).join(', ');
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
    // Limpeza de jogos antigos
    await supabase.from('daily_games').delete().lt('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    // Buscar Jogos de Hoje
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    const predictionsGenerated = [];

    console.log(`🏀 Encontrados ${games.length} jogos para análise.`);

    for (const [index, game] of games.entries()) {
      try {
        const gameId = game.id; 
        console.log(`[${index + 1}/${games.length}] Processando jogo ID: ${gameId}...`);

        // Verifica se já existe para pular rápido
        const { data: existing } = await supabase.from('daily_games').select('id').eq('espn_game_id', gameId).maybeSingle();
        if (existing) {
             console.log("-> Jogo já existe no banco, pulando análise.");
             continue;
        }

        const competidores = game.competitions[0].competitors;
        const homeTeam = competidores.find((c: any) => c.homeAway === 'home').team;
        const awayTeam = competidores.find((c: any) => c.homeAway === 'away').team;

        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` 
        };

        // Busca contexto técnico
        const [homeStats, awayStats] = await Promise.all([
          fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: homeTeam.id }) }).then(r => r.json()),
          fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: awayTeam.id }) }).then(r => r.json())
        ]);

        const prompt = `
          Atue como o analista sênior do portal DuoDunk.
          
          CONFRONTO: ${homeTeam.displayName} (Casa) vs ${awayTeam.displayName} (Visitante).
          
          MANDANTE (${homeTeam.displayName}):
          - Campanha: ${homeStats.record?.wins}-${homeStats.record?.losses} (${homeStats.record?.streak})
          - Últimos 5: ${homeStats.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-')}
          - Destaques da Temporada: ${formatLeaders(homeStats.leaders)}
          
          VISITANTE (${awayTeam.displayName}):
          - Campanha: ${awayStats.record?.wins}-${awayStats.record?.losses} (${awayStats.record?.streak})
          - Últimos 5: ${awayStats.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-')}
          - Destaques da Temporada: ${formatLeaders(awayStats.leaders)}

          REGRAS DE TEXTO:
          1. PROIBIDO usar a palavra "Momentum". Use "Ritmo", "Fase", "Sequência" ou "Embalada".
          2. Cite os jogadores destaque se relevante para o palpite.
          3. Texto curto, vibrante e técnico (Max 280 caracteres).

          RESPOSTA JSON:
          { "palpite": "...", "analise": "...", "confianca": 0-100 }
        `;

        const geminiRes = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
          })
        });
        
        // Tratamento de Erro de Cota Específico
        if (geminiRes.status === 429) {
            console.warn("⚠️ Cota excedida (429)! Aguardando 60 segundos antes de prosseguir...");
            await delay(60000); 
            continue; 
        }

        if (!geminiRes.ok) {
            throw new Error(`Erro na API do Gemini: ${geminiRes.status}`);
        }

        const geminiData = await geminiRes.json();
        const aiResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);

        // Salva com Logos
        const { data: gameDb, error: gameError } = await supabase.from('daily_games').insert({
          espn_game_id: gameId,
          date: game.date, 
          home_team_id: homeTeam.id,
          home_team_name: homeTeam.displayName,
          home_team_logo: homeTeam.logo,
          visitor_team_id: awayTeam.id,
          visitor_team_name: awayTeam.displayName,
          visitor_team_logo: awayTeam.logo
        }).select().single();

        if (gameError) throw gameError;

        if (gameDb) {
          await supabase.from('predictions').insert({
            game_id: gameDb.id,
            prediction_title: aiResult.palpite,
            prediction_analysis: aiResult.analise,
            confidence_score: aiResult.confianca,
            ai_model: GEMINI_MODEL
          });
          predictionsGenerated.push(`${homeTeam.displayName} vs ${awayTeam.displayName}`);
        }

        // 🛑 O FREIO MÁGICO AJUSTADO:
        // 60 segundos / 5 requests (limite) = 12 segundos.
        console.log("Aguardando 12s (Limite Teto da API)...");
        await delay(12000);

      } catch (gameError) {
        console.error(`Erro no jogo ${game.id}:`, gameError);
        continue; 
      }
    }

    return new Response(JSON.stringify({ success: true, count: predictionsGenerated.length }), { headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});