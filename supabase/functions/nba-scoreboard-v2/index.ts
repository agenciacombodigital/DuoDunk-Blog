import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Helper para buscar a classificação e mapear por Tricode
const fetchStandingsMap = async () => {
    try {
        const standingsUrl = 'https://cdn.nba.com/static/json/liveData/standings/leagueStandings.json';
        const response = await fetch(standingsUrl);
        if (!response.ok) return new Map();
        const data = await response.json();
        const standingsMap = new Map();

        if (data?.league?.standard?.conference) {
            data.league.standard.conference.forEach((conf: any) => {
                conf.team.forEach((team: any) => {
                    standingsMap.set(team.teamTricode, {
                        wins: team.win,
                        losses: team.loss,
                    });
                });
            });
        }
        return standingsMap;
    } catch (error) {
        console.error('[Standings Fetch] Error:', error.message);
        return new Map();
    }
};

// FALLBACK: Função para buscar da ESPN se a NBA falhar
const fetchESPNFallback = async (dateStr: string) => {
  try {
    console.log(`[Scoreboard] Tentando Fallback ESPN para a data: ${dateStr}`);
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
    const response = await fetch(espnUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.events || data.events.length === 0) return null;

    const standingsMap = await fetchStandingsMap();

    // Mapear ESPN para o formato esperado pelo componente NBA
    const games = data.events.map((event: any) => {
      const competition = event.competitions[0];
      const home = competition.competitors.find((c: any) => c.homeAway === 'home');
      const away = competition.competitors.find((c: any) => c.homeAway === 'away');
      
      const status = competition.status.type.name;
      let gameStatus = 1; // agendado
      if (competition.status.type.state === 'in') gameStatus = 2; // ao vivo
      if (competition.status.type.completed) gameStatus = 3; // finalizado

      // Injetar recordes
      const hRecord = standingsMap.get(home.team.abbreviation) || { wins: 0, losses: 0 };
      const aRecord = standingsMap.get(away.team.abbreviation) || { wins: 0, losses: 0 };

      return {
        gameId: event.id,
        gameStatus: gameStatus,
        gameStatusText: competition.status.type.shortDetail,
        gameTimeUTC: event.date,
        gameClock: competition.status.displayClock || "",
        period: competition.status.period,
        broadcastChannel: competition.broadcasts?.[0]?.names?.[0] || "League Pass",
        homeTeam: {
          teamName: home.team.displayName,
          teamTricode: home.team.abbreviation,
          score: home.score || "0",
          wins: hRecord.wins,
          losses: hRecord.losses,
          logo: home.team.logo,
          teamId: home.id
        },
        awayTeam: {
          teamName: away.team.displayName,
          teamTricode: away.team.abbreviation,
          score: away.score || "0",
          wins: aRecord.wins,
          losses: aRecord.losses,
          logo: away.team.logo,
          teamId: away.id
        }
      };
    });

    return { games };
  } catch (e) {
    console.error('[ESPN Fallback] Error:', e.message);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const cacheBuster = new Date().getTime();
    const now = new Date();
    // Data para o fallback (YYYYMMDD)
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).replace(/-/g, '');

    // 1. Tentar API da NBA
    const nbaApiUrl = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json?_=${cacheBuster}`;
    const response = await fetch(nbaApiUrl, {
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

    let scoreboardData = null;
    if (response.ok) {
        const data = await response.json();
        // Se a API da NBA retornar vazio, consideramos "atrasada"
        if (data.scoreboard && data.scoreboard.games && data.scoreboard.games.length > 0) {
            scoreboardData = data.scoreboard;
            console.log(`[Scoreboard] Dados obtidos via NBA API (${scoreboardData.games.length} jogos)`);
        }
    }

    // 2. Fallback para ESPN se NBA falhar ou estiver vazia
    if (!scoreboardData) {
        const fallback = await fetchESPNFallback(dateStr);
        if (fallback) {
            scoreboardData = fallback;
            console.log(`[Scoreboard] Dados obtidos via ESPN Fallback (${scoreboardData.games.length} jogos)`);
        }
    }

    if (!scoreboardData || !scoreboardData.games) {
      return new Response(JSON.stringify({ success: true, scoreboard: { games: [] } }), {
        headers: { ...corsHeaders }, status: 200,
      });
    }

    // Se vier da NBA (original), precisamos injetar os recordes (o Fallback ESPN já faz isso)
    if (!scoreboardData.games[0].gameTimeUTC) { // Heurística simples para saber se é formato NBA original
        const standingsMap = await fetchStandingsMap();
        scoreboardData.games.forEach((game: any) => {
            const h = standingsMap.get(game.homeTeam.teamTricode);
            const a = standingsMap.get(game.awayTeam.teamTricode);
            if (h) { game.homeTeam.wins = h.wins; game.homeTeam.losses = h.losses; }
            if (a) { game.awayTeam.wins = a.wins; game.awayTeam.losses = a.losses; }
            if (game.broadcasters?.video?.national?.length > 0) {
                game.broadcastChannel = game.broadcasters.video.national[0].longName;
            }
        });
    }

    return new Response(JSON.stringify({ success: true, scoreboard: scoreboardData }), {
      headers: { ...corsHeaders }, status: 200,
    });

  } catch (error) {
    console.error('Error in nba-scoreboard-v2:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders }, status: 500,
    });
  }
});