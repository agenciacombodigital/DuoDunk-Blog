import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const fetchPlayerData = async (playerId: string) => {
  const playerUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/players/${playerId}`;
  const playerResponse = await fetch(playerUrl);
  if (!playerResponse.ok) throw new Error(`Failed to fetch player data for ID ${playerId}`);
  const data = await playerResponse.json();
  const player = data.athlete;
  const team = player.team;

  return {
    id: player.id,
    name: player.displayName,
    team: team.displayName,
    teamLogo: team.logos[0].href,
    position: player.position.abbreviation,
    headshot: player.headshot.href,
    stats: {
      points: player.statsSummary.statistics.find((s: any) => s.name === 'points')?.value || 0,
      rebounds: player.statsSummary.statistics.find((s: any) => s.name === 'rebounds')?.value || 0,
      assists: player.statsSummary.statistics.find((s: any) => s.name === 'assists')?.value || 0,
      steals: player.statsSummary.statistics.find((s: any) => s.name === 'steals')?.value || 0,
      blocks: player.statsSummary.statistics.find((s: any) => s.name === 'blocks')?.value || 0,
      turnovers: player.statsSummary.statistics.find((s: any) => s.name === 'turnovers')?.value || 0,
      fieldGoalPct: (player.statsSummary.statistics.find((s: any) => s.name === 'fieldGoalPct')?.value || 0) * 100,
      threePointPct: (player.statsSummary.statistics.find((s: any) => s.name === 'threePointPct')?.value || 0) * 100,
      freeThrowPct: (player.statsSummary.statistics.find((s: any) => s.name === 'freeThrowPct')?.value || 0) * 100,
    }
  };
};

const STAT_CATEGORIES = [
  { name: 'points', label: 'Pontos por Jogo', higherIsBetter: true },
  { name: 'rebounds', label: 'Rebotes por Jogo', higherIsBetter: true },
  { name: 'assists', label: 'Assistências por Jogo', higherIsBetter: true },
  { name: 'steals', label: 'Roubos por Jogo', higherIsBetter: true },
  { name: 'blocks', label: 'Tocos por Jogo', higherIsBetter: true },
  { name: 'turnovers', label: 'Turnovers por Jogo', higherIsBetter: false },
  { name: 'fieldGoalPct', label: 'FG%', higherIsBetter: true },
  { name: 'threePointPct', label: '3P%', higherIsBetter: true },
  { name: 'freeThrowPct', label: 'FT%', higherIsBetter: true },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { player1Id, player2Id } = await req.json();
    if (!player1Id || !player2Id) throw new Error('player1Id and player2Id are required');

    const [p1Data, p2Data] = await Promise.all([
      fetchPlayerData(player1Id),
      fetchPlayerData(player2Id)
    ]);

    const categories = STAT_CATEGORIES.map(cat => {
      const p1Value = p1Data.stats[cat.name as keyof typeof p1Data.stats];
      const p2Value = p2Data.stats[cat.name as keyof typeof p2Data.stats];
      
      let winner: 1 | 2 | 'tie' = 'tie';
      if (p1Value !== p2Value) {
        if (cat.higherIsBetter) {
          winner = p1Value > p2Value ? 1 : 2;
        } else {
          winner = p1Value < p2Value ? 1 : 2;
        }
      }

      return {
        name: cat.name,
        label: cat.label,
        player1Value: p1Value,
        player2Value: p2Value,
        winner,
        higherIsBetter: cat.higherIsBetter,
      };
    });

    const comparison = {
      player1: {
        id: p1Data.id,
        name: p1Data.name,
        team: p1Data.team,
        teamLogo: p1Data.teamLogo,
        position: p1Data.position,
        headshot: p1Data.headshot,
      },
      player2: {
        id: p2Data.id,
        name: p2Data.name,
        team: p2Data.team,
        teamLogo: p2Data.teamLogo,
        position: p2Data.position,
        headshot: p2Data.headshot,
      },
      categories,
    };

    return new Response(JSON.stringify({ success: true, comparison }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-player-comparison function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});