import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper to fetch individual boxscore for real-time data
const fetchBoxscore = async (gameId: string) => {
  try {
    const cacheBuster = new Date().getTime();
    const boxscoreUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json?_=${cacheBuster}`;
    
    const response = await fetch(boxscoreUrl, {
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    if (!response.ok) {
      console.warn(`[Boxscore Fetch] Failed for game ${gameId}, status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error(`[Boxscore Fetch] Error for game ${gameId}:`, error.message);
    return null;
  }
};

// NOVO: Função para buscar a classificação e mapear por Tricode
const fetchStandingsMap = async () => {
    try {
        const standingsUrl = 'https://cdn.nba.com/static/json/liveData/standings/leagueStandings.json';
        const response = await fetch(standingsUrl);
        if (!response.ok) {
            console.warn('[Standings Fetch] Failed to fetch standings.');
            return new Map();
        }
        const data = await response.json();
        const standingsMap = new Map();

        data.league.standard.conference.forEach((conf: any) => {
            conf.team.forEach((team: any) => {
                standingsMap.set(team.teamTricode, {
                    wins: team.win,
                    losses: team.loss,
                });
            });
        });
        return standingsMap;
    } catch (error) {
        console.error('[Standings Fetch] Error:', error.message);
        return new Map();
    }
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cacheBuster = new Date().getTime();
    // Mantendo a URL da NBA para o placar, pois a Edge Function anterior já estava usando
    const nbaApiUrl = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json?_=${cacheBuster}`;
    
    const response = await fetch(nbaApiUrl, {
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    if (!response.ok) {
      console.error(`[nba-scoreboard-v2] NBA API request failed with status ${response.status}`);
      throw new Error(`NBA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const scoreboard = data.scoreboard;
    
    if (!scoreboard || !scoreboard.games) {
      return new Response(JSON.stringify({ success: true, scoreboard: { games: [] } }), {
        headers: { ...corsHeaders },
        status: 200,
      });
    }
    
    // 1. Buscar a classificação atualizada
    const standingsMap = await fetchStandingsMap();
    
    // 2. Identificar jogos potencialmente ao vivo e buscar boxscores
    const now = new Date();
    const potentiallyLiveGameIds = scoreboard.games
      .filter((game: any) => {
        const gameTime = new Date(game.gameTimeUTC);
        const isOfficiallyLive = game.gameStatus === 2;
        const mightBeLive = game.gameStatus === 1 && gameTime <= now;
        return isOfficiallyLive || mightBeLive;
      })
      .map((game: any) => game.gameId);

    if (potentiallyLiveGameIds.length > 0) {
      console.log(`[nba-scoreboard-v2] Found ${potentiallyLiveGameIds.length} potentially live games. Fetching real-time boxscores...`);
      
      const boxscorePromises = potentiallyLiveGameIds.map(fetchBoxscore);
      const boxscoreResults = await Promise.all(boxscorePromises);

      const liveGameDataMap = new Map();
      boxscoreResults.forEach(gameData => {
        if (gameData) {
          liveGameDataMap.set(gameData.gameId, gameData);
        }
      });

      // 3. Atualizar placar com dados em tempo real e classificação
      scoreboard.games.forEach((game: any) => {
        const liveData = liveGameDataMap.get(game.gameId);
        
        if (liveData) {
          // Update scores and status from the more reliable boxscore source
          game.homeTeam.score = liveData.homeTeam.score;
          game.awayTeam.score = liveData.awayTeam.score;
          game.gameStatus = liveData.gameStatus;
          game.gameClock = liveData.gameClock;
          game.period = liveData.period;
          game.gameStatusText = liveData.gameStatusText;
        }
        
        // 4. Injetar Wins/Losses da classificação (para jogos agendados/finalizados)
        const homeRecord = standingsMap.get(game.homeTeam.teamTricode);
        const awayRecord = standingsMap.get(game.awayTeam.teamTricode);
        
        if (homeRecord) {
            game.homeTeam.wins = homeRecord.wins;
            game.homeTeam.losses = homeRecord.losses;
        }
        if (awayRecord) {
            game.awayTeam.wins = awayRecord.wins;
            game.awayTeam.losses = awayRecord.losses;
        }
        
        // Adicionar informações de transmissão (broadcasts)
        if (game.broadcasters && game.broadcasters.video) {
            const nationalBroadcasts = game.broadcasters.video.national;
            if (nationalBroadcasts && nationalBroadcasts.length > 0) {
                game.broadcastChannel = nationalBroadcasts[0].longName;
            }
        }
      });
    } else {
        // Se não estiver ao vivo, apenas adiciona o canal de transmissão e o recorde
        scoreboard.games.forEach((game: any) => {
            // Injetar Wins/Losses da classificação
            const homeRecord = standingsMap.get(game.homeTeam.teamTricode);
            const awayRecord = standingsMap.get(game.awayTeam.teamTricode);
            
            if (homeRecord) {
                game.homeTeam.wins = homeRecord.wins;
                game.homeTeam.losses = homeRecord.losses;
            }
            if (awayRecord) {
                game.awayTeam.wins = awayRecord.wins;
                game.awayTeam.losses = awayRecord.losses;
            }
            
            if (game.broadcasters && game.broadcasters.video) {
                const nationalBroadcasts = game.broadcasters.video.national;
                if (nationalBroadcasts && nationalBroadcasts.length > 0) {
                    game.broadcastChannel = nationalBroadcasts[0].longName;
                }
            }
        });
    }
    
    const gameCount = scoreboard.games.length || 0;
    console.log(`[nba-scoreboard-v2] Fetched and processed data successfully. Found ${gameCount} games.`);

    return new Response(JSON.stringify({ success: true, scoreboard }), {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error('Error in nba-scoreboard-v2 function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});