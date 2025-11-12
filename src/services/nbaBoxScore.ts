import axios from 'axios';

export interface PlayerStats {
  nome: string;
  playerId: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg: string; // Ex: "7/15"
  fgPct: string; // Ex: "46.7%"
  threePt: string; // Ex: "3/8"
  threePtPct: string; // Ex: "37.5%"
}

export interface TeamBoxScore {
  teamName: string;
  teamAbbr: string;
  score: number;
  record: string; // Ex: "(11-1)"
  players: PlayerStats[];
  teamThreePt: string; // Ex: "16/36 (44.4%)"
  topThreePointShooter: string; // Ex: "Shai: 3/6"
}

export interface GameBoxScore {
  gameId: string;
  gameDate: string;
  homeTeam: TeamBoxScore;
  awayTeam: TeamBoxScore;
  attendance?: number;
  arena?: string;
}

/**
 * Processa lista de jogadores e retorna os top N por pontos
 */
function processarJogadores(players: any[], topN: number): PlayerStats[] {
  return players
    .filter(p => p.statistics.minutesCalculated !== '00:00') // Apenas jogadores que jogaram
    .map(p => ({
      nome: p.name,
      playerId: p.personId,
      pts: p.statistics.points,
      reb: p.statistics.reboundsTotal,
      ast: p.statistics.assists,
      stl: p.statistics.steals,
      blk: p.statistics.blocks,
      fg: `${p.statistics.fieldGoalsMade}/${p.statistics.fieldGoalsAttempted}`,
      fgPct: `${(p.statistics.fieldGoalsPercentage * 100).toFixed(1)}%`,
      threePt: `${p.statistics.threePointersMade}/${p.statistics.threePointersAttempted}`,
      threePtPct: `${(p.statistics.threePointersPercentage * 100).toFixed(1)}%`,
    }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, topN);
}

/**
 * Calcula estatísticas de triplos do time
 */
function calcularTriplosTime(stats: any): string {
  const made = stats.threePointersMade;
  const attempted = stats.threePointersAttempted;
  if (attempted === 0) return '0/0 (0.0%)';
  const pct = ((made / attempted) * 100).toFixed(1);
  return `${made}/${attempted} (${pct}%)`;
}

/**
 * Identifica o melhor arremessador de 3 pontos
 */
function identificarMelhorTriplo(players: any[]): string {
  const topShooter = players
    .filter(p => p.statistics.threePointersMade > 0)
    .sort((a, b) => b.statistics.threePointersMade - a.statistics.threePointersMade)[0];
  
  if (!topShooter) return 'N/D';
  
  const nameParts = topShooter.name.split(' ');
  const firstName = nameParts.length > 1 ? nameParts[0] : topShooter.name;
  return `${firstName}: ${topShooter.statistics.threePointersMade}/${topShooter.statistics.threePointersAttempted}`;
}

/**
 * Busca o box score completo de um jogo específico
 */
export async function buscarBoxScoreJogo(gameId: string): Promise<GameBoxScore | null> {
  try {
    const response = await axios.get(
      `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
      {
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://www.nba.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const data = response.data.game;
    
    // Processar dados do time da casa
    const homeTeam: TeamBoxScore = {
      teamName: data.homeTeam.teamName,
      teamAbbr: data.homeTeam.teamTricode,
      score: data.homeTeam.score,
      record: `(${data.homeTeam.wins}-${data.homeTeam.losses})`,
      players: processarJogadores(data.homeTeam.players, 5),
      teamThreePt: calcularTriplosTime(data.homeTeam.statistics),
      topThreePointShooter: identificarMelhorTriplo(data.homeTeam.players),
    };

    // Processar dados do time visitante
    const awayTeam: TeamBoxScore = {
      teamName: data.awayTeam.teamName,
      teamAbbr: data.awayTeam.teamTricode,
      score: data.awayTeam.score,
      record: `(${data.awayTeam.wins}-${data.awayTeam.losses})`,
      players: processarJogadores(data.awayTeam.players, 5),
      teamThreePt: calcularTriplosTime(data.awayTeam.statistics),
      topThreePointShooter: identificarMelhorTriplo(data.awayTeam.players),
    };

    return {
      gameId,
      gameDate: data.gameTimeUTC,
      homeTeam,
      awayTeam,
      attendance: data.attendance,
      arena: data.arena.arenaName,
    };
  } catch (error) {
    console.error('Erro ao buscar box score:', error);
    return null;
  }
}

/**
 * Busca todos os jogos do dia anterior e seus box scores
 */
export async function buscarJogosOntemComBoxScore(): Promise<GameBoxScore[]> {
  try {
    // Buscar jogos de ontem
    // Nota: A API da NBA usa o horário de Nova York para 'todaysScoreboard'.
    // Para simular 'ontem' rodando às 2h BR (5h UTC), buscamos o scoreboard de hoje,
    // mas filtramos apenas os jogos 'Finalizados'.
    
    const response = await axios.get(
      `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`
    );

    const jogosFinalizados = response.data.scoreboard.games
      .filter((g: any) => g.gameStatusText === 'Final');

    // Buscar box score de cada jogo
    const boxScores = await Promise.all(
      jogosFinalizados.map((game: any) => buscarBoxScoreJogo(game.gameId))
    );

    return boxScores.filter(bs => bs !== null) as GameBoxScore[];
  } catch (error) {
    console.error('Erro ao buscar jogos de ontem:', error);
    return [];
  }
}