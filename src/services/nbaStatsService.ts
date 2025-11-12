import leadersData from '../../content/nba_leaders.json';

// Mapeamento de índices do array de resultados da NBA.com
const HEADERS = {
  PLAYER_ID: 0,
  RANK: 1,
  PLAYER: 2,
  TEAM_ID: 3,
  TEAM_ABBREVIATION: 4,
  PTS: 5,
  REB: 6,
  AST: 7,
  STL: 8,
  BLK: 9,
  FG3M: 10,
};

// IDs de Time da NBA.com (para logos)
const TEAM_IDS: Record<string, string> = {
  'MIL': '1610612749',
  'DAL': '1610612742',
  'OKC': '1610612760',
  'PHI': '1610612755',
  'MIN': '1610612750',
  'DEN': '1610612743',
  'GSW': '1610612744',
  'BOS': '1610612738',
  'PHX': '1610612756',
  'LAL': '1610612747',
  'IND': '1610612754',
  'SAC': '1610612758',
  'SAS': '1610612759',
  'NOP': '1610612740',
  'UTA': '1610612762',
  'CLE': '1610612739',
  'MIA': '1610612748',
  'MEM': '1610612763',
  'ORL': '1610612753',
  'DET': '1610612765',
};

const obterFotoJogador = (id: string): string => {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
};

const obterLogoTime = (sigla: string): string => {
  const teamId = TEAM_IDS[sigla.toUpperCase()];
  if (!teamId) return '';
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
};

export interface EstatisticaJogador {
  id: string;
  nome: string;
  siglaTime: string;
  logoTime: string;
  posicao: string; // Posição não está no JSON, será mockada ou removida
  foto: string;
  pontos: number;
  rebotes: number;
  assistencias: number;
  roubos: number;
  tocos: number;
  triplos: number;
}

// Mapeamento de posições (mockado, pois a API LeagueLeaders não retorna posição)
const POSITIONS: Record<string, string> = {
  'Joel Embiid': 'C',
  'Giannis Antetokounmpo': 'PF',
  'Shai Gilgeous-Alexander': 'PG',
  'Luka Doncic': 'PG',
  'Kevin Durant': 'PF',
  'Jayson Tatum': 'SF',
  'Donovan Mitchell': 'SG',
  'Nikola Jokic': 'C',
  'Stephen Curry': 'PG',
  'Anthony Edwards': 'SG',
  'LeBron James': 'SF',
  'De\'Aaron Fox': 'PG',
  'Damian Lillard': 'PG',
  'Desmond Bane': 'SG',
  'Lauri Markkanen': 'PF',
  'Zion Williamson': 'PF',
  'Cade Cunningham': 'PG',
  'Paolo Banchero': 'PF',
  'Victor Wembanyama': 'C',
  'Bam Adebayo': 'C',
  'Tyrese Haliburton': 'PG',
};


export function getLeadersByCategory(category: keyof typeof leadersData): EstatisticaJogador[] {
  const categoryData = leadersData[category];
  
  if (!categoryData || !categoryData.resultSets || categoryData.resultSets.length === 0) {
    return [];
  }

  const rows = categoryData.resultSets[0].rowSet;

  return rows.map((row: any[]) => {
    const siglaTime = row[HEADERS.TEAM_ABBREVIATION];
    const nomeJogador = row[HEADERS.PLAYER];
    const playerId = String(row[HEADERS.PLAYER_ID]);

    return {
      id: playerId,
      nome: nomeJogador,
      siglaTime: siglaTime,
      logoTime: obterLogoTime(siglaTime),
      posicao: POSITIONS[nomeJogador] || 'N/D', // Usando mock de posição
      foto: obterFotoJogador(playerId),
      pontos: parseFloat(row[HEADERS.PTS]),
      rebotes: parseFloat(row[HEADERS.REB]),
      assistencias: parseFloat(row[HEADERS.AST]),
      roubos: parseFloat(row[HEADERS.STL]),
      tocos: parseFloat(row[HEADERS.BLK]),
      triplos: parseFloat(row[HEADERS.FG3M]),
    };
  });
}

/**
 * Retorna todos os jogadores únicos com todas as estatísticas.
 * Usado para popular a tabela principal na página Estatisticas.
 */
export function getAllPlayersWithStats(): EstatisticaJogador[] {
  const allPlayersMap = new Map<string, EstatisticaJogador>();
  
  // Itera sobre todas as categorias para garantir que todos os jogadores sejam capturados
  for (const categoryKey in leadersData) {
    const players = getLeadersByCategory(categoryKey as keyof typeof leadersData);
    
    players.forEach(player => {
      if (!allPlayersMap.has(player.id)) {
        // Se o jogador for novo, adiciona com todas as stats
        allPlayersMap.set(player.id, player);
      } else {
        // Se o jogador já existe, garante que as stats estão atualizadas (embora neste mock, elas sejam as mesmas)
        const existingPlayer = allPlayersMap.get(player.id)!;
        allPlayersMap.set(player.id, {
          ...existingPlayer,
          pontos: player.pontos,
          rebotes: player.rebotes,
          assistencias: player.assistencias,
          roubos: player.roubos,
          tocos: player.tocos,
          triplos: player.triplos,
        });
      }
    });
  }
  
  return Array.from(allPlayersMap.values());
}