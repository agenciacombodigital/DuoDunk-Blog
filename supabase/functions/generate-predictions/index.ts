import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
// URL da função interna para histórico recente (Last 5 Games)
const NBA_TEAM_INFO_URL = `${SUPABASE_URL}/functions/v1/nba-team-info`; 

// Mantendo o modelo mais recente disponível (Gemini 2.5 Flash)
const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- HELPERS ---

// 1. Delay para respeitar Rate Limit (12s = 5 req/min)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 2. Busca Detalhes Profundos na ESPN (Summary Endpoint - Stats Ricos)
async function getGameDetails(gameId: string) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    // Identifica IDs dos times no JSON da ESPN
    const homeId = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.id;
    const awayId = data.header?.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.id;

    // Extrai líderes de estatísticas (PTS, REB, AST)
    const homeLeadersData = data.leaders?.find((l: any) => l.team.id === homeId)?.leaders || [];
    const awayLeadersData = data.leaders?.find((l: any) => l.team.id === awayId)?.leaders || [];
    
    // Extrai probabilidades da ESPN (se disponível)
    const espnPrediction = data.predictor?.homeTeam?.gameProjection || "N/A";

    return { homeLeadersData, awayLeadersData, espnPrediction };
  } catch (e) {
    console.error("Erro ao buscar summary ESPN:", e);
    return null;
  }
}

// 3. Formata Líderes Completos para o Prompt
const formatFullLeaders = (leaders: any[]) => {
  if (!leaders || leaders.length === 0) return "Dados indisponíveis.";
  // Mapeia categorias (Ex: Points, Rebounds, Assists)
  return leaders.map(cat => {
    const player = cat.leaders?.[0]; // Melhor jogador naquela categoria
    if (!player) return "";
    return `${cat.displayName}: ${player.athlete.displayName} (${player.displayValue})`;
  }).filter(Boolean).join(' | ');
};

// --- SERVIDOR ---

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
       headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // 1. Limpeza Automática de jogos muito antigos (> 5 dias)
    // Isso mantém o banco leve
    await supabase.from('daily_games').delete().lt('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    // 2. Buscar Jogos de Hoje na ESPN
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    const predictionsGenerated = [];

    console.log(`🏀 Encontrados ${games.length} jogos para análise.`);

    // 3. Loop pelos jogos do dia
    for (const [index, game] of games.entries()) {
      try {
        const gameId = game.id; 
        console.log(`[${index + 1}/${games.length}] Processando jogo ID: ${gameId}...`);

        // --- REGENERAÇÃO INTELIGENTE ---
        // Verifica se já existe. Se existir, DELETE para recriar com a nova lógica.
        const { data: existing } = await supabase.from('daily_games').select('id').eq('espn_game_id', gameId).maybeSingle();
        
        if (existing) {
             console.log("-> Jogo existente encontrado. Deletando para regenerar...");
             // Deleta o jogo antigo (o 'predictions' será deletado via CASCADE se configurado, ou ficará órfão)
             await supabase.from('daily_games').delete().eq('id', existing.id);
        }

        const competidores = game.competitions[0].competitors;
        const homeTeam = competidores.find((c: any) => c.homeAway === 'home').team;
        const awayTeam = competidores.find((c: any) => c.homeAway === 'away').team;

        // 4. Buscar Contextos (Stats Ricos + Histórico Interno)
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` 
        };

        // Fetch Paralelo para economizar tempo
        const [homeInternal, awayInternal, gameDetails] = await Promise.all([
            fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: homeTeam.id }) }).then(r => r.json()).catch(() => ({})),
            fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: awayTeam.id }) }).then(r => r.json()).catch(() => ({})),
            getGameDetails(gameId) // Busca stats ricos na ESPN
        ]);

        const safeDetails = gameDetails || { homeLeadersData: [], awayLeadersData: [], espnPrediction: "N/A" };

        // 5. Montar Prompt RICO
        const prompt = `
          Atue como o analista sênior de apostas do portal DuoDunk.
          
          CONFRONTO: ${homeTeam.displayName} (Casa) vs ${awayTeam.displayName} (Visitante).
          PROBABILIDADE ESPN (Predictor): ${safeDetails.espnPrediction === "N/A" ? "Indisponível" : safeDetails.espnPrediction + "% para " + homeTeam.displayName}.
          
          MANDANTE (${homeTeam.displayName}):
          - Campanha: ${homeInternal.record?.wins || 0}-${homeInternal.record?.losses || 0} (${homeInternal.record?.streak || '-'})
          - Últimos 5 Jogos: ${homeInternal.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-') || 'N/A'}
          - LÍDERES COMPLETOS: ${formatFullLeaders(safeDetails.homeLeadersData)}
          
          VISITANTE (${awayTeam.displayName}):
          - Campanha: ${awayInternal.record?.wins || 0}-${awayInternal.record?.losses || 0} (${awayInternal.record?.streak || '-'})
          - Últimos 5 Jogos: ${awayInternal.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-') || 'N/A'}
          - LÍDERES COMPLETOS: ${formatFullLeaders(safeDetails.awayLeadersData)}

          SUA MISSÃO:
          Analise o confronto considerando o momento recente e os matchups dos líderes (Ex: rebotes, assistências).
          
          REGRAS:
          1. NÃO use a palavra "Momentum" (Use "Ritmo", "Fase").
          2. Cite dados específicos dos líderes (Ex: "com Jokic liderando em assistências...") para embasar.
          3. Texto curto, vibrante e técnico (Max 280 caracteres).
          
          RESPOSTA JSON:
          { "palpite": "Ex: Lakers Vence", "analise": "Texto curto.", "confianca": 0-100 }
        `;

        // 6. Chamar Gemini
        const geminiRes = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
          })
        });

        // Tratamento de Erro de Cota (429)
        if (geminiRes.status === 429) {
            console.warn("⚠️ Cota excedida (429)! Aguardando 60s...");
            await delay(60000);
            // Aqui decidimos continuar (tentar o próximo) ou retry. Vamos dar continue para não travar tudo.
            continue; 
        }

        if (!geminiRes.ok) {
             console.error(`Erro API Gemini: ${geminiRes.status}`);
             continue;
        }

        const geminiData = await geminiRes.json();
        const aiResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);

        // 7. Salvar no Banco (Usando URL de logo estável baseada em ID)
        const { data: gameDb, error: gameError } = await supabase.from('daily_games').insert({
          espn_game_id: gameId,
          date: game.date, 
          home_team_id: homeTeam.id,
          home_team_name: homeTeam.displayName,
          home_team_logo: `https://a.espncdn.com/i/teamlogos/nba/500/${homeTeam.id}.png`,
          visitor_team_id: awayTeam.id,
          visitor_team_name: awayTeam.displayName,
          visitor_team_logo: `https://a.espncdn.com/i/teamlogos/nba/500/${awayTeam.id}.png`
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

        // 8. DELAY INTELIGENTE (Rate Limit: 12s)
        // Só espera se NÃO for o último jogo. Isso economiza 12s no final.
        if (index < games.length - 1) {
            console.log("Aguardando 12s para respeitar a cota...");
            await delay(12000);
        }

      } catch (gameError) {
        console.error(`Erro no jogo ${game.id}:`, gameError);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ success: true, count: predictionsGenerated.length, games: predictionsGenerated }), 
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});