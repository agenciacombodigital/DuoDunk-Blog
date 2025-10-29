import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const formatDateKey = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { month, teamId } = await req.json();
    if (!month) {
      return new Response(JSON.stringify({ success: false, error: 'Month (YYYYMM) is required' }), {
        headers: { ...corsHeaders }, status: 400
      });
    }

    const apiUrl = `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`NBA API request failed with status ${response.status}`);

    const data = await response.json();
    const leagueSchedule = data?.leagueSchedule;
    
    if (!leagueSchedule || !leagueSchedule.gameDates) {
      return new Response(JSON.stringify({ success: true, calendar: {}, totalGames: 0 }), {
        headers: { ...corsHeaders }, status: 200
      });
    }

    const calendar: { [key: string]: any[] } = {};
    let totalGames = 0;

    leagueSchedule.gameDates.forEach((dateEntry: any) => {
      const dateKey = formatDateKey(dateEntry.gameDate);
      const monthKey = dateKey.substring(0, 7).replace('-', '');
      
      if (monthKey !== month) return;

      const gamesForDate = dateEntry.games.filter((game: any) => {
        if (!teamId || teamId === '') return true; // No filter, include all games
        const homeId = String(game.homeTeam.teamId);
        const awayId = String(game.awayTeam.teamId);
        return teamId === homeId || teamId === awayId;
      });

      if (gamesForDate.length > 0) {
        calendar[dateKey] = gamesForDate.map((game: any) => {
          totalGames++;
          const gameStatus = game.gameStatus;
          let statusTextPt = 'Agendado';
          if (gameStatus === 2) statusTextPt = 'AO VIVO';
          else if (gameStatus === 3) statusTextPt = 'FINAL';

          return {
            id: game.gameId,
            date: game.gameDateTimeUTC,
            timeBrasilia: convertToBrasiliaTime(game.gameDateTimeUTC),
            status: game.gameStatusText,
            statusTextPt,
            gameStatus,
            name: `${game.awayTeam.teamName} @ ${game.homeTeam.teamName}`,
            homeTeam: {
              id: String(game.homeTeam.teamId),
              name: game.homeTeam.teamName,
              tricode: game.homeTeam.teamTricode,
              logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
              score: game.homeTeam.score?.toString() || '',
            },
            awayTeam: {
              id: String(game.awayTeam.teamId),
              name: game.awayTeam.teamName,
              tricode: game.awayTeam.teamTricode,
              logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
              score: game.awayTeam.score?.toString() || '',
            },
            whereToWatch: game.broadcasters?.national?.map((b: any) => b.broadcasterDisplay).join(', ') || 'N/D',
          };
        });
      }
    });

    return new Response(JSON.stringify({ success: true, calendar, totalGames }), {
      headers: { ...corsHeaders }, status: 200
    });

  } catch (error) {
    console.error('Error in nba-calendar function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders }, status: 500
    });
  }
});