import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const convertToBrasiliaTime = (dateString: string) => {
  try {
    const date = new new Date(dateString)();
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Sao_Paulo' 
    });
  } catch (e) {
    return 'N/D';
  }
};

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

    const scheduleParts = ['00', '01', '02', '03', '04', '05', '06', '07', '08'];
    const baseUrl = 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_';

    const fetchPromises = scheduleParts.map(part => 
      fetch(`${baseUrl}${part}.json`).catch(e => {
        console.error(`Failed to fetch part ${part}:`, e.message);
        return null;
      })
    );

    const responses = await Promise.all(fetchPromises);
    let allGameDates: any[] = [];

    for (const response of responses) {
      if (response && response.ok) {
        const data = await response.json();
        if (data?.leagueSchedule?.gameDates) {
          allGameDates = allGameDates.concat(data.leagueSchedule.gameDates);
        }
      }
    }
    
    if (allGameDates.length === 0) {
      return new Response(JSON.stringify({ success: true, calendar: {}, totalGames: 0 }), {
        headers: { ...corsHeaders }, status: 200
      });
    }

    const calendar: { [key: string]: any[] } = {};
    let totalGames = 0;
    
    const requestedYear = month.substring(0, 4);
    const requestedMonthComponent = month.substring(4, 6);

    allGameDates.forEach((dateEntry: any) => {
      const gameDate = new Date(dateEntry.gameDate);
      const gameDateMonthComponent = String(gameDate.getUTCMonth() + 1).padStart(2, '0');
      
      if (gameDateMonthComponent !== requestedMonthComponent) return;

      const dayComponent = String(gameDate.getUTCDate()).padStart(2, '0');
      // **CORREÇÃO:** Usar o ano do pedido para criar a chave, não o ano da API.
      const dateKey = `${requestedYear}-${gameDateMonthComponent}-${dayComponent}`;

      const gamesForDate = dateEntry.games.filter((game: any) => {
        if (!teamId || teamId === '') return true;
        const homeId = String(game.homeTeam.teamId);
        const awayId = String(game.awayTeam.teamId);
        return teamId === homeId || teamId === awayId;
      });

      if (gamesForDate.length > 0) {
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        
        const newGames = gamesForDate.map((game: any) => {
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
            period: game.period,
            gameClock: formatGameClock(game.gameClock),
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
        
        calendar[dateKey].push(...newGames);
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