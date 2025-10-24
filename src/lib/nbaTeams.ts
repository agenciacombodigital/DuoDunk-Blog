export interface NBATeam {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  conference: 'East' | 'West';
  division: string;
}

export const NBA_TEAMS: NBATeam[] = [
  // CONFERÊNCIA LESTE
  { id: '1', slug: 'hawks', name: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'East', division: 'Southeast' },
  { id: '2', slug: 'celtics', name: 'Boston Celtics', abbreviation: 'BOS', conference: 'East', division: 'Atlantic' },
  { id: '17', slug: 'nets', name: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'East', division: 'Atlantic' },
  { id: '30', slug: 'hornets', name: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'East', division: 'Southeast' },
  { id: '4', slug: 'bulls', name: 'Chicago Bulls', abbreviation: 'CHI', conference: 'East', division: 'Central' },
  { id: '5', slug: 'cavaliers', name: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'East', division: 'Central' },
  { id: '8', slug: 'pistons', name: 'Detroit Pistons', abbreviation: 'DET', conference: 'East', division: 'Central' },
  { id: '11', slug: 'pacers', name: 'Indiana Pacers', abbreviation: 'IND', conference: 'East', division: 'Central' },
  { id: '14', slug: 'heat', name: 'Miami Heat', abbreviation: 'MIA', conference: 'East', division: 'Southeast' },
  { id: '15', slug: 'bucks', name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'East', division: 'Central' },
  { id: '18', slug: 'knicks', name: 'New York Knicks', abbreviation: 'NYK', conference: 'East', division: 'Atlantic' },
  { id: '19', slug: 'magic', name: 'Orlando Magic', abbreviation: 'ORL', conference: 'East', division: 'Southeast' },
  { id: '20', slug: '76ers', name: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'East', division: 'Atlantic' },
  { id: '28', slug: 'raptors', name: 'Toronto Raptors', abbreviation: 'TOR', conference: 'East', division: 'Atlantic' },
  { id: '27', slug: 'wizards', name: 'Washington Wizards', abbreviation: 'WAS', conference: 'East', division: 'Southeast' },
  
  // CONFERÊNCIA OESTE
  { id: '6', slug: 'mavericks', name: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'West', division: 'Southwest' },
  { id: '7', slug: 'nuggets', name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'West', division: 'Northwest' },
  { id: '9', slug: 'warriors', name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'West', division: 'Pacific' },
  { id: '10', slug: 'rockets', name: 'Houston Rockets', abbreviation: 'HOU', conference: 'West', division: 'Southwest' },
  { id: '12', slug: 'clippers', name: 'LA Clippers', abbreviation: 'LAC', conference: 'West', division: 'Pacific' },
  { id: '13', slug: 'lakers', name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'West', division: 'Pacific' },
  { id: '29', slug: 'grizzlies', name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'West', division: 'Southwest' },
  { id: '16', slug: 'timberwolves', name: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'West', division: 'Northwest' },
  { id: '3', slug: 'pelicans', name: 'New Orleans Pelicans', abbreviation: 'NO', conference: 'West', division: 'Southwest' },
  { id: '25', slug: 'thunder', name: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'West', division: 'Northwest' },
  { id: '21', slug: 'suns', name: 'Phoenix Suns', abbreviation: 'PHX', conference: 'West', division: 'Pacific' },
  { id: '22', slug: 'trail-blazers', name: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'West', division: 'Northwest' },
  { id: '23', slug: 'kings', name: 'Sacramento Kings', abbreviation: 'SAC', conference: 'West', division: 'Pacific' },
  { id: '24', slug: 'spurs', name: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'West', division: 'Southwest' },
  { id: '26', slug: 'jazz', name: 'Utah Jazz', abbreviation: 'UTAH', conference: 'West', division: 'Northwest' },
];

export function getTeamBySlug(slug: string): NBATeam | undefined {
  return NBA_TEAMS.find(team => team.slug === slug);
}

export function getTeamById(id: string): NBATeam | undefined {
  return NBA_TEAMS.find(team => team.id === id);
}