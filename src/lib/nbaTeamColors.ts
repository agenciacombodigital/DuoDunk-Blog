export interface TeamColors {
  primary: string;
  secondary: string;
  text: string;
}

export const NBA_TEAM_COLORS: Record<string, TeamColors> = {
  // LESTE
  'ATL': { primary: '#E03A3E', secondary: '#C1D32F', text: '#1D2227' }, // Hawks
  'BOS': { primary: '#007A33', secondary: '#BA9653', text: '#FFFFFF' }, // Celtics
  'BKN': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' }, // Nets
  'CHA': { primary: '#1D1160', secondary: '#00788C', text: '#FFFFFF' }, // Hornets
  'CHI': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Bulls
  'CLE': { primary: '#6F263D', secondary: '#FFB81C', text: '#FFFFFF' }, // Cavaliers
  'DET': { primary: '#C8102E', secondary: '#1D42BA', text: '#FFFFFF' }, // Pistons
  'IND': { primary: '#002D62', secondary: '#FDBB30', text: '#FFFFFF' }, // Pacers
  'MIA': { primary: '#98002B', secondary: '#F9A01B', text: '#FFFFFF' }, // Heat
  'MIL': { primary: '#00471B', secondary: '#EEE1C6', text: '#FFFFFF' }, // Bucks
  'NYK': { primary: '#F58426', secondary: '#006BB6', text: '#FFFFFF' }, // Knicks
  'ORL': { primary: '#0077C0', secondary: '#C4CED4', text: '#FFFFFF' }, // Magic
  'PHI': { primary: '#006BB6', secondary: '#ED174B', text: '#FFFFFF' }, // 76ers
  'TOR': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Raptors
  'WAS': { primary: '#002B5C', secondary: '#E31837', text: '#FFFFFF' }, // Wizards

  // OESTE
  'DAL': { primary: '#00538C', secondary: '#B8C4CA', text: '#FFFFFF' }, // Mavericks
  'DEN': { primary: '#0E2240', secondary: '#FEC524', text: '#FFFFFF' }, // Nuggets
  'GSW': { primary: '#1D428A', secondary: '#FFC72C', text: '#FFFFFF' }, // Warriors
  'HOU': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Rockets
  'LAC': { primary: '#1D428A', secondary: '#C8102E', text: '#FFFFFF' }, // Clippers
  'LAL': { primary: '#552583', secondary: '#FDB927', text: '#FFFFFF' }, // Lakers
  'MEM': { primary: '#5D76A9', secondary: '#12173F', text: '#FFFFFF' }, // Grizzlies
  'MIN': { primary: '#0C2340', secondary: '#78BE20', text: '#FFFFFF' }, // Timberwolves
  'NO': { primary: '#002D62', secondary: '#B4975A', text: '#FFFFFF' }, // Pelicans (Usando 'NO' para New Orleans)
  'OKC': { primary: '#007AC1', secondary: '#EF3B24', text: '#FFFFFF' }, // Thunder
  'PHX': { primary: '#1D1160', secondary: '#E56020', text: '#FFFFFF' }, // Suns
  'POR': { primary: '#E03A3E', secondary: '#000000', text: '#FFFFFF' }, // Trail Blazers
  'SAC': { primary: '#5A2D81', secondary: '#63727A', text: '#FFFFFF' }, // Kings
  'SAS': { primary: '#C4CED4', secondary: '#000000', text: '#1D2227' }, // Spurs
  'UTA': { primary: '#002B5C', secondary: '#F9A01B', text: '#FFFFFF' }, // Jazz (Usando 'UTA' para Utah)
};

export function getTeamColors(abbreviation: string): TeamColors {
  const abbr = abbreviation.toUpperCase();
  return NBA_TEAM_COLORS[abbr] || { primary: '#f3f4f6', secondary: '#e5e7eb', text: '#1f2937' }; // Default gray
}