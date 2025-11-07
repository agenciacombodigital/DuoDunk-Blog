export interface TeamColors {
  primary: string;
  secondary: string;
  text: string;
}

export const NBA_TEAM_COLORS: Record<string, TeamColors> = {
  // LESTE
  'ATL': { primary: '#E03A3E', secondary: '#C1D32F', text: '#1D2227' }, // Hawks (Red, Volt Green)
  'BOS': { primary: '#007A33', secondary: '#BA9653', text: '#FFFFFF' }, // Celtics (Green, Gold)
  'BKN': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' }, // Nets (Black, White)
  'CHA': { primary: '#1D1160', secondary: '#00788C', text: '#FFFFFF' }, // Hornets (Purple, Teal)
  'CHI': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Bulls (Red, Black)
  'CLE': { primary: '#860038', secondary: '#FDBB30', text: '#FFFFFF' }, // Cavaliers (Wine, Gold)
  'DET': { primary: '#C8102E', secondary: '#1D42BA', text: '#FFFFFF' }, // Pistons (Red, Royal)
  'IND': { primary: '#002D62', secondary: '#FDBB30', text: '#FFFFFF' }, // Pacers (Blue, Yellow)
  'MIA': { primary: '#98002E', secondary: '#F9A01B', text: '#FFFFFF' }, // Heat (Red, Yellow)
  'MIL': { primary: '#00471B', secondary: '#EEE1C6', text: '#FFFFFF' }, // Bucks (Green, Cream)
  'NYK': { primary: '#006BB6', secondary: '#F58426', text: '#FFFFFF' }, // Knicks (Blue, Orange)
  'ORL': { primary: '#0077C0', secondary: '#C4CED4', text: '#FFFFFF' }, // Magic (Blue, Silver)
  'PHI': { primary: '#006BB6', secondary: '#ED174C', text: '#FFFFFF' }, // 76ers (Blue, Red)
  'TOR': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Raptors (Red, Black)
  'WAS': { primary: '#002B5C', secondary: '#E31837', text: '#FFFFFF' }, // Wizards (Navy Blue, Red)

  // OESTE
  'DAL': { primary: '#00538C', secondary: '#B8C4CA', text: '#FFFFFF' }, // Mavericks (Royal Blue, Silver)
  'DEN': { primary: '#0E2240', secondary: '#FEC524', text: '#FFFFFF' }, // Nuggets (Midnight Blue, Sunshine Yellow)
  'GSW': { primary: '#1D428A', secondary: '#FFC72C', text: '#FFFFFF' }, // Warriors (Blue, Golden Yellow)
  'HOU': { primary: '#CE1141', secondary: '#000000', text: '#FFFFFF' }, // Rockets (Red, Black)
  'LAC': { primary: '#C8102E', secondary: '#1D428A', text: '#FFFFFF' }, // Clippers (Red, Blue)
  'LAL': { primary: '#552583', secondary: '#FDB927', text: '#FFFFFF' }, // Lakers (Purple, Gold)
  'MEM': { primary: '#5D76A9', secondary: '#12173F', text: '#FFFFFF' }, // Grizzlies (Blue, Navy)
  'MIN': { primary: '#0C2340', secondary: '#78BE20', text: '#FFFFFF' }, // Timberwolves (Midnight Blue, Aurora Green)
  'NO': { primary: '#0C2340', secondary: '#C8102E', text: '#FFFFFF' }, // Pelicans (Navy, Red)
  'OKC': { primary: '#007AC1', secondary: '#EF3B24', text: '#FFFFFF' }, // Thunder (Blue, Sunset)
  'PHX': { primary: '#1D1160', secondary: '#E56020', text: '#FFFFFF' }, // Suns (Purple, Orange)
  'POR': { primary: '#E03A3E', secondary: '#000000', text: '#FFFFFF' }, // Trail Blazers (Red, Black)
  'SAC': { primary: '#5A2D81', secondary: '#63727A', text: '#FFFFFF' }, // Kings (Purple, Gray)
  'SAS': { primary: '#C4CED4', secondary: '#000000', text: '#1D2227' }, // Spurs (Silver, Black)
  'UTA': { primary: '#002B5C', secondary: '#F9A01B', text: '#FFFFFF' }, // Jazz (Navy, Yellow)
};

export function getTeamColors(abbreviation: string): TeamColors {
  let abbr = abbreviation.toUpperCase();
  
  // Mapeamento de abreviações comuns/antigas para as oficiais
  if (abbr === 'NOP') abbr = 'NO';
  if (abbr === 'UTAH') abbr = 'UTA';
  if (abbr === 'NY') abbr = 'NYK'; // New York Knicks
  if (abbr === 'SA') abbr = 'SAS'; // San Antonio Spurs
  if (abbr === 'GS') abbr = 'GSW'; // Golden State Warriors
  if (abbr === 'WSH') abbr = 'WAS'; // Washington Wizards

  return NBA_TEAM_COLORS[abbr] || { primary: '#f3f4f6', secondary: '#e5e7eb', text: '#1f2937' }; // Default gray
}