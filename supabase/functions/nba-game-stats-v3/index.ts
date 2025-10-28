import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper to get top performers for a stat
const getTopPerformers = (players: any[], statKey: string, count: number) => {
  if (!players || players.length === 0) return [];

  return players
    .filter(p => p.status === 'ACTIVE' && p.statistics[statKey] > 0)
    .sort((a, b) => b.statistics[statKey] - a.statistics[statKey])
    .slice(0, count)
    .map(p => ({
      name: p.nameI,
      value: p.statistics[statKey]?.toString() || '0',
      fgm: p.statistics.fieldGoalsMade?.toString(),
      fga: p.statistics.fieldGoalsAttempted?.toString(),
      fg3m: p.statistics.threePointersMade?.toString(),
      fg3a: p.statistics.threePointersAttempted?.toString(),
      ftm: p.statistics.freeThrowsMade?.toString(),
      fta: p.statistics.freeThrowsAttempted?.toString(),
    }));
};

// Helper to map game status
const getGameState = (status: number) => {
  if (status === 1) return 'pre';
  if (status === 2) return 'in';
  if (status === 3) return 'post';
  return 'pre'; // Default
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { gameId, homeRecord, awayRecord } = await req.json();
    if (!gameId) {
      throw new Error('gameId is required');
    }

    const cacheBuster = new Date().getTime();
    const apiUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json?_=${cacheBuster}`;
    
    const response = await fetch(apiUrl, {
      cache: "no-store", // Força a busca por dados novos
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    if (!response.ok) {
      throw new Error(`NBA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const game = data.game;

    if (!game) {
      return new Response(JSON.stringify({ success: false, message: 'Game data not found.' }), {
        headers: { ...corsHeaders },
        status: 404,
      });
    }

    const homePlayers = game.homeTeam.players;
    const awayPlayers = game.awayTeam.players;

    const stats = {
      status: game.gameStatusText,
      gameState: getGameState(game.gameStatus),
      gameClock: game.gameClock,
      period: game.period,
      quarterScores: {
        home: game.homeTeam.periods.map((p: any) => ({ period: p.period, score: p.score.toString() })),
        away: game.awayTeam.periods.map((p: any) => ({ period: p.period, score: p.score.toString() })),
      },
      homeTeam: {
        name: game.homeTeam.teamName,
        abbreviation: game.homeTeam.teamTricode,
        logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
        score: game.homeTeam.score.toString(),
        record: homeRecord || '0-0',
        performers: {
          points: getTopPerformers(homePlayers, 'points', 2),
          rebounds: getTopPerformers(homePlayers, 'reboundsTotal', 2),
          assists: getTopPerformers(homePlayers, 'assists', 2),
        },
      },
      awayTeam: {
        name: game.awayTeam.teamName,
        abbreviation: game.awayTeam.teamTricode,
        logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
        score: game.awayTeam.score.toString(),
        record: awayRecord || '0-0',
        performers: {
          points: getTopPerformers(awayPlayers, 'points', 2),
          rebounds: getTopPerformers(awayPlayers, 'reboundsTotal', 2),
          assists: getTopPerformers(awayPlayers, 'assists', 2),
        },
      },
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-game-stats-v3 function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});