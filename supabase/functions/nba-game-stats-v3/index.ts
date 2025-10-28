import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper para converter UTC para horário de Brasília (BRT/BRST)
const convertToBrasiliaTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Sao_Paulo' 
    });
  } catch (e) {
    return 'N/D';
  }
};

// Helper para formatar o tempo de jogo
const formatGameClock = (clock: string): string => {
  if (!clock || clock === '') return '';
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (match) {
    const minutes = match[1].padStart(2, '0');
    const seconds = Math.floor(parseFloat(match[2])).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  return clock;
};

// Helper para formatar estatísticas de um jogador
const mapPlayerStats = (player: any) => {
  const stats = player.statistics;
  return {
    id: player.personId,
    nameI: player.nameI,
    jerseyNum: player.jerseyNum,
    position: player.position,
    starter: player.starter === '1',
    oncourt: player.oncourt === '1',
    stats: {
      minutes: stats.minutesCalculated?.replace('PT', '').replace('M', ':').replace('S', '').slice(0, 5) || '00:00',
      points: stats.points,
      rebounds: stats.reboundsTotal,
      assists: stats.assists,
      steals: stats.steals,
      blocks: stats.blocks,
      turnovers: stats.turnovers,
      plusMinus: stats.plusMinusPoints,
      fgm: stats.fieldGoalsMade,
      fga: stats.fieldGoalsAttempted,
      fgPct: (stats.fieldGoalsPercentage * 100).toFixed(1),
      fg3m: stats.threePointersMade,
      fg3a: stats.threePointersAttempted,
      fg3Pct: (stats.threePointersPercentage * 100).toFixed(1),
      ftm: stats.freeThrowsMade,
      fta: stats.freeThrowsAttempted,
      ftPct: (stats.freeThrowsPercentage * 100).toFixed(1),
    }
  };
};

// Helper para formatar estatísticas de um time
const mapTeamStats = (teamStats: any) => ({
    fieldGoals: `${teamStats.fieldGoalsMade}-${teamStats.fieldGoalsAttempted}`,
    fieldGoalPct: (teamStats.fieldGoalsPercentage * 100).toFixed(1),
    threePointers: `${teamStats.threePointersMade}-${teamStats.threePointersAttempted}`,
    threePointerPct: (teamStats.threePointersPercentage * 100).toFixed(1),
    freeThrows: `${teamStats.freeThrowsMade}-${teamStats.freeThrowsAttempted}`,
    freeThrowPct: (teamStats.freeThrowsPercentage * 100).toFixed(1),
    rebounds: teamStats.reboundsTotal,
    assists: teamStats.assists,
    steals: teamStats.steals,
    blocks: teamStats.blocks,
    turnovers: teamStats.turnovers,
    fouls: teamStats.foulsTotal,
});

// Helper para pegar os melhores jogadores em uma estatística
const getTopPerformers = (players: any[], statKey: string, count: number) => {
  return players
    .filter(p => p.stats[statKey] > 0)
    .sort((a, b) => b.stats[statKey] - a.stats[statKey])
    .slice(0, count)
    .map(p => ({ ...p, value: p.stats[statKey] }));
};

const getGameState = (status: number) => {
  if (status === 1) return 'pre';
  if (status === 2) return 'in';
  if (status === 3) return 'post';
  return 'pre';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { gameId, homeRecord, awayRecord } = await req.json();
    if (!gameId) throw new Error('gameId is required');

    const cacheBuster = new Date().getTime();
    const apiUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json?_=${cacheBuster}`;
    
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    if (!response.ok) throw new Error(`NBA API request failed with status ${response.status}`);

    const data = await response.json();
    const game = data.game;

    if (!game) {
      return new Response(JSON.stringify({ success: false, message: 'Game data not found.' }), {
        headers: { ...corsHeaders }, status: 404
      });
    }

    // Se o jogo ainda não começou, retorna um status especial
    if (game.gameStatus === 1) {
      return new Response(JSON.stringify({ success: true, isScheduled: true }), {
        headers: { ...corsHeaders }, status: 200
      });
    }

    const allHomePlayers = game.homeTeam.players.map(mapPlayerStats);
    const allAwayPlayers = game.awayTeam.players.map(mapPlayerStats);

    const stats = {
      status: game.gameStatusText,
      gameState: getGameState(game.gameStatus),
      gameClock: formatGameClock(game.gameClock),
      period: game.period,
      arena: game.arena.arenaName,
      city: game.arena.arenaCity,
      attendance: game.attendance,
      gameTimeBrasilia: convertToBrasiliaTime(game.gameTimeUTC),
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
        allPlayers: allHomePlayers,
        teamStats: mapTeamStats(game.homeTeam.statistics),
        performers: {
          points: getTopPerformers(allHomePlayers, 'points', 5),
          rebounds: getTopPerformers(allHomePlayers, 'rebounds', 3),
          assists: getTopPerformers(allHomePlayers, 'assists', 3),
          steals: getTopPerformers(allHomePlayers, 'steals', 3),
          blocks: getTopPerformers(allHomePlayers, 'blocks', 3),
          plusMinus: getTopPerformers(allHomePlayers, 'plusMinus', 3),
        },
      },
      awayTeam: {
        name: game.awayTeam.teamName,
        abbreviation: game.awayTeam.teamTricode,
        logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
        score: game.awayTeam.score.toString(),
        record: awayRecord || '0-0',
        allPlayers: allAwayPlayers,
        teamStats: mapTeamStats(game.awayTeam.statistics),
        performers: {
          points: getTopPerformers(allAwayPlayers, 'points', 5),
          rebounds: getTopPerformers(allAwayPlayers, 'rebounds', 3),
          assists: getTopPerformers(allAwayPlayers, 'assists', 3),
          steals: getTopPerformers(allAwayPlayers, 'steals', 3),
          blocks: getTopPerformers(allAwayPlayers, 'blocks', 3),
          plusMinus: getTopPerformers(allAwayPlayers, 'plusMinus', 3),
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