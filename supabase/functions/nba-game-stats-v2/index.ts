import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper function to find the leader for a specific stat
const findLeader = (players: any[], statKey: string) => {
  if (!players || players.length === 0) {
    return null;
  }

  const activePlayers = players.filter(p => p.status === 'ACTIVE');
  if (activePlayers.length === 0) {
    return null;
  }

  const leader = activePlayers.reduce((maxPlayer, currentPlayer) => {
    if (currentPlayer.statistics[statKey] > maxPlayer.statistics[statKey]) {
      return currentPlayer;
    }
    return maxPlayer;
  }, activePlayers[0]);

  // Only return a leader if they have a non-zero stat
  if (leader.statistics[statKey] > 0) {
    return {
      displayName: leader.nameI, // "F. Lastname" format
      value: leader.statistics[statKey].toString(),
    };
  }

  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { gameId } = await req.json();
    if (!gameId) {
      throw new Error('gameId is required');
    }

    const apiUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`;
    const response = await fetch(apiUrl);

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
      homeTeam: {
        name: game.homeTeam.teamName,
        abbreviation: game.homeTeam.teamTricode,
        logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
        score: game.homeTeam.score.toString(),
        leaders: {
          points: findLeader(homePlayers, 'points'),
          rebounds: findLeader(homePlayers, 'reboundsTotal'),
          assists: findLeader(homePlayers, 'assists'),
        },
        players: homePlayers,
      },
      awayTeam: {
        name: game.awayTeam.teamName,
        abbreviation: game.awayTeam.teamTricode,
        logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
        score: game.awayTeam.score.toString(),
        leaders: {
          points: findLeader(awayPlayers, 'points'),
          rebounds: findLeader(awayPlayers, 'reboundsTotal'),
          assists: findLeader(awayPlayers, 'assists'),
        },
        players: awayPlayers,
      },
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-game-stats-v2 function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});