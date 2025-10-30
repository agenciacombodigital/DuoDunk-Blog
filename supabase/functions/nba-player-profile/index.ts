import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { playerId } = await req.json();
    if (!playerId) throw new Error('playerId is required');

    const playerUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/players/${playerId}`;
    const playerResponse = await fetch(playerUrl);
    if (!playerResponse.ok) throw new Error(`Failed to fetch player data for ID ${playerId}`);
    const playerData = await playerResponse.json();

    const player = playerData.athlete;
    const team = player.team;

    // Fetch gamelog for last games
    const gamelogUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/players/${playerId}/gamelog`;
    const gamelogResponse = await fetch(gamelogUrl);
    let lastGames = [];
    if (gamelogResponse.ok) {
        const gamelogData = await gamelogResponse.json();
        if (gamelogData.gamelog) {
            lastGames = gamelogData.gamelog.slice(0, 10).map((game: any) => {
                // Robust stat parsing
                const statKeys = game.stats[0]?.keys || [];
                const statValues = game.stats[0]?.stats || [];

                const getStat = (key: string) => {
                    const index = statKeys.indexOf(key);
                    // Return 'N/A' or a default for stats that might not be present (like for DNP)
                    return index !== -1 ? statValues[index] : '0';
                };

                return {
                    id: game.gameId,
                    date: new Date(game.gameDate).toLocaleDateString('pt-BR'),
                    opponent: game.opponent.abbreviation,
                    opponentLogo: game.opponent.logo,
                    result: game.gameResult,
                    score: game.teamScore ? `${game.teamScore}-${game.opponentScore}` : 'N/A',
                    points: parseInt(getStat('PTS') || '0'),
                    rebounds: parseInt(getStat('REB') || '0'),
                    assists: parseInt(getStat('AST') || '0'),
                    minutes: getStat('MIN'),
                    fieldGoals: getStat('FGM-A'),
                    threePointers: getStat('3PM-A'),
                    freeThrows: getStat('FTM-A'),
                };
            });
        }
    }

    const profile = {
      id: player.id,
      name: player.displayName,
      fullName: player.fullName,
      position: player.position?.abbreviation || 'N/A',
      jersey: player.jersey,
      height: player.displayHeight,
      weight: player.displayWeight,
      age: player.age,
      birthDate: new Date(player.dateOfBirth).toLocaleDateString('pt-BR'),
      birthPlace: [player.birthPlace?.city, player.birthPlace?.state || player.birthPlace?.country].filter(Boolean).join(', '),
      college: player.college?.name || 'N/A',
      experience: player.experience?.years || 0,
      team: {
        id: team?.id,
        name: team?.displayName,
        abbreviation: team?.abbreviation,
        logo: team?.logos?.[0]?.href || '',
        color: team?.color || '000000',
      },
      headshotLarge: player.headshot?.href || '',
      stats: {
        season: playerData.season?.displayName || 'N/A',
        gamesPlayed: player.statsSummary?.statistics.find((s: any) => s.name === 'gamesPlayed')?.value || 0,
        minutes: player.statsSummary?.statistics.find((s: any) => s.name === 'minutes')?.value || 0,
        points: player.statsSummary?.statistics.find((s: any) => s.name === 'points')?.value || 0,
        rebounds: player.statsSummary?.statistics.find((s: any) => s.name === 'rebounds')?.value || 0,
        assists: player.statsSummary?.statistics.find((s: any) => s.name === 'assists')?.value || 0,
        steals: player.statsSummary?.statistics.find((s: any) => s.name === 'steals')?.value || 0,
        blocks: player.statsSummary?.statistics.find((s: any) => s.name === 'blocks')?.value || 0,
        turnovers: player.statsSummary?.statistics.find((s: any) => s.name === 'turnovers')?.value || 0,
        fieldGoalPct: (player.statsSummary?.statistics.find((s: any) => s.name === 'fieldGoalPct')?.value || 0) * 100,
        threePointPct: (player.statsSummary?.statistics.find((s: any) => s.name === 'threePointPct')?.value || 0) * 100,
        freeThrowPct: (player.statsSummary?.statistics.find((s: any) => s.name === 'freeThrowPct')?.value || 0) * 100,
        plusMinus: 0, // This stat is not in the summary
      },
      lastGames: lastGames,
      awards: player.awards?.map((a: any) => a.displayName) || [],
    };

    return new Response(JSON.stringify({ success: true, player: profile }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-player-profile function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});