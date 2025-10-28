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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cacheBuster = new Date().getTime();
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

    // Identify live games to fetch real-time data
    const liveGameIds = scoreboard.games
      .filter((game: any) => game.gameStatus === 2) // gameStatus 2 is "in-progress"
      .map((game: any) => game.gameId);

    if (liveGameIds.length > 0) {
      console.log(`[nba-scoreboard-v2] Found ${liveGameIds.length} live games. Fetching real-time boxscores...`);
      
      const boxscorePromises = liveGameIds.map(fetchBoxscore);
      const boxscoreResults = await Promise.all(boxscorePromises);

      const liveGameDataMap = new Map();
      boxscoreResults.forEach(gameData => {
        if (gameData) {
          liveGameDataMap.set(gameData.gameId, gameData);
        }
      });

      // Update scoreboard games with real-time data from boxscores
      scoreboard.games.forEach((game: any) => {
        if (liveGameDataMap.has(game.gameId)) {
          const liveData = liveGameDataMap.get(game.gameId);
          const clock = liveData.gameClock;
          let formattedClock = '';
          const match = clock.match(/PT(\d+)M([\d.]+)S/);
          if (match) {
              const minutes = match[1].padStart(2, '0');
              const seconds = Math.floor(parseFloat(match[2])).toString().padStart(2, '0');
              formattedClock = `${minutes}:${seconds}`;
          }

          game.homeTeam.score = liveData.homeTeam.score;
          game.awayTeam.score = liveData.awayTeam.score;
          game.gameStatusText = `${liveData.period}º Quarto • ${formattedClock}`;
          game.gameClock = liveData.gameClock;
          game.period = liveData.period;
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