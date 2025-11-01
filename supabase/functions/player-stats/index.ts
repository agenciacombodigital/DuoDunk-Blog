import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper para calcular minutos por jogo (MIN)
const formatMinutes = (minutes: number, gamesPlayed: number): string => {
  if (gamesPlayed === 0) return '00:00';
  
  const totalMinutes = minutes / gamesPlayed;
  const min = Math.floor(totalMinutes);
  const sec = Math.round((totalMinutes - min) * 60);
  
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { playerId, season } = await req.json();
    
    if (!playerId || !season) {
      return new Response(JSON.stringify({ success: false, error: 'playerId and season are required' }), {
        headers: { ...corsHeaders },
        status: 400,
      });
    }

    // BallDontLie API URL para estatísticas sazonais
    const apiUrl = `https://api.balldontlie.io/v1/season_averages?season=${season}&player_ids[]=${playerId}`;
    
    // Nota: A BallDontLie API requer uma chave de API no header. 
    // Como não temos uma chave configurada como segredo, vamos simular a chamada.
    // Em um ambiente real, você precisaria de uma chave.
    
    // Simulação de dados (substituir pela chamada real se a chave estivesse disponível)
    // const response = await fetch(apiUrl, { headers: { 'Authorization': 'Bearer YOUR_BALLDONTLIE_API_KEY' } });
    // if (!response.ok) throw new Error(`BallDontLie API request failed with status ${response.status}`);
    // const data = await response.json();
    
    // Usando dados mockados para garantir a estrutura de retorno
    const mockData = {
      data: [
        {
          id: 1,
          season: season,
          player_id: playerId,
          games_played: 70,
          min: "35.0",
          fgm: 12.5,
          fga: 25.0,
          fg_pct: 0.500,
          fg3m: 3.0,
          fg3a: 8.0,
          fg3_pct: 0.375,
          ftm: 6.0,
          fta: 7.5,
          ft_pct: 0.800,
          oreb: 1.5,
          dreb: 6.5,
          reb: 8.0,
          ast: 9.5,
          stl: 1.5,
          blk: 0.5,
          turnover: 3.5,
          pf: 2.5,
          pts: 34.0,
          fantasy_points: 55.0,
          is_active: true,
          player_name: "Luka Doncic"
        }
      ]
    };

    const statsData = mockData.data[0];

    if (!statsData) {
      return new Response(JSON.stringify({ success: true, stats: null, message: "Nenhuma estatística encontrada para a temporada." }), {
        headers: { ...corsHeaders },
        status: 200,
      });
    }

    // Mapeamento e formatação dos dados
    const stats = {
      games_played: statsData.games_played,
      player_id: statsData.player_id,
      season: statsData.season,
      min: formatMinutes(parseFloat(statsData.min) * statsData.games_played, statsData.games_played),
      pts: statsData.pts,
      reb: statsData.reb,
      ast: statsData.ast,
      stl: statsData.stl,
      blk: statsData.blk,
      turnover: statsData.turnover,
      fg_pct: statsData.fg_pct * 100,
      fg3_pct: statsData.fg3_pct * 100,
      ft_pct: statsData.ft_pct * 100,
      fgm: statsData.fgm,
      fga: statsData.fga,
      fg3m: statsData.fg3m,
      fg3a: statsData.fg3a,
      ftm: statsData.ftm,
      fta: statsData.fta,
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in player-stats function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});