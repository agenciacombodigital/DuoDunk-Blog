import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper para formatar a data para o formato YYYY-MM-DD
const formatDateKey = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para converter UTC para horário de Brasília (BRT/BRST)
const convertToBrasiliaTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // Formato: HH:MM
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
    const body = await req.json();
    const { month, teamId } = body; // month format YYYYMM
    
    if (!month) {
      return new Response(JSON.stringify({ success: false, error: 'Month (YYYYMM) is required' }), {
        headers: { ...corsHeaders },
        status: 400,
      });
    }

    // URL da API da NBA para o calendário mensal
    const apiUrl = `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`NBA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const leagueSchedule = data?.leagueSchedule;
    
    if (!leagueSchedule || !leagueSchedule.gameDates) {
      return new Response(JSON.stringify({ success: true, calendar: {}, totalGames: 0 }), {
        headers: { ...corsHeaders },
        status: 200,
      });
    }

    const calendar: { [key: string]: any[] } = {};
    let totalGames = 0;

    leagueSchedule.gameDates.forEach((dateEntry: any) => {
      const dateKey = formatDateKey(dateEntry.gameDate);
      const monthKey = dateKey.substring(0, 7).replace('-', ''); // YYYYMM
      
      // Filtra apenas jogos do mês solicitado
      if (monthKey !== month) return;

      dateEntry.games.forEach((game: any) => {
        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        
        // Aplica filtro de time, se houver
        if (teamId && teamId !== String(homeTeam.teamId) && teamId !== String(awayTeam.teamId)) {
          return;
        }

        const gameData = {
          id: game.gameId,
          date: game.gameDateTimeUTC,
          timeBrasilia: convertToBrasiliaTime(game.gameDateTimeUTC),
          status: game.gameStatusText,
          gameStatus: game.gameStatus, // Status numérico
          name: `${awayTeam.teamName} @ ${homeTeam.teamName}`,
          homeTeam: {
            id: String(homeTeam.teamId),
            name: homeTeam.teamName,
            tricode: homeTeam.teamTricode,
            logo: `https://cdn.nba.com/logos/nba/${homeTeam.teamId}/primary/L/logo.svg`,
            score: game.homeTeam.score?.toString() || '',
          },
          awayTeam: {
            id: String(awayTeam.teamId),
            name: awayTeam.teamName,
            tricode: awayTeam.teamTricode,
            logo: `https://cdn.nba.com/logos/nba/${awayTeam.teamId}/primary/L/logo.svg`,
            score: game.awayTeam.score?.toString() || '',
          },
          whereToWatch: game.broadcasters?.map((b: any) => b.broadcasterName).join(', ') || 'N/D',
        };

        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        calendar[dateKey].push(gameData);
        totalGames++;
      });
    });

    return new Response(JSON.stringify({ success: true, calendar, totalGames }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-calendar function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});