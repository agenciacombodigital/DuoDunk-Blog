import rawStats from '../../content/nba_stats_espncore.json';

interface StatValue {
  name: string;
  value: string;
}

interface StatSplit {
  stats: StatValue[];
}

interface StatCategory {
  name: string; // Ex: "Regular Season"
  splits: StatSplit[];
}

interface PlayerCoreData {
  id: string;
  name: string;
  team: string;
  position: string;
  jersey: string;
  headshot: string;
  stats: StatCategory[];
}

const stats: PlayerCoreData[] = rawStats as PlayerCoreData[];

export interface PlayerLeader {
  id: string;
  name: string;
  team: string;
  position: string;
  jersey: string;
  headshot: string;
  value: number;
}

/**
 * Busca os top N jogadores em uma estatística específica (ex: 'points', 'rebounds').
 * Assume que a estatística está aninhada em 'stats' -> 'splits' -> 'stats'.
 */
export function getTopPlayers(statName: string, topN = 10): PlayerLeader[] {
  const lowerStatName = statName.toLowerCase();

  return stats
    .map(player => {
      let statValue = 0;
      
      // 1. Encontrar a categoria principal (geralmente 'Regular Season')
      const regularSeasonCategory = player.stats.find(c => c.name.toLowerCase().includes('regular season'));
      
      if (regularSeasonCategory && regularSeasonCategory.splits && regularSeasonCategory.splits.length > 0) {
        // 2. Acessar o split de estatísticas
        const statSplit = regularSeasonCategory.splits[0];
        
        // 3. Encontrar a estatística específica (ex: 'points')
        const statObj = statSplit.stats.find(s => s.name.toLowerCase().includes(lowerStatName));
        
        statValue = parseFloat(statObj?.value || '0');
      }
      
      return {
        id: player.id,
        name: player.name,
        team: player.team,
        position: player.position,
        jersey: player.jersey,
        headshot: player.headshot,
        value: statValue,
      };
    })
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);
}

// Exporta as categorias que podem ser buscadas
export const STAT_CATEGORIES = [
  { key: 'points', abbreviation: 'PTS', name: 'Pontos' },
  { key: 'rebounds', abbreviation: 'REB', name: 'Rebotes' },
  { key: 'assists', abbreviation: 'AST', name: 'Assistências' },
  { key: 'steals', abbreviation: 'STL', name: 'Roubos de Bola' },
  { key: 'blocks', abbreviation: 'BLK', name: 'Tocos' },
  { key: 'threePointFieldGoalsMade', abbreviation: '3PM', name: 'Bolas de 3 Feitas' },
  { key: 'fieldGoalPercentage', abbreviation: 'FG%', name: 'Aproveitamento FG' },
  { key: 'freeThrowPercentage', abbreviation: 'FT%', name: 'Aproveitamento FT' },
];