import leadersData from '../../content/nba_leaders_espn.json';

export interface PlayerStats {
  displayName: string;
  teamAbbreviation: string;
  value: number;
  rank: number;
  headshot: string;
  id: string;
}

export interface LeaderCategory {
  name: string;
  abbreviation: string;
  leaders: PlayerStats[];
}

function mapESPNLeaders(categoryData: any): PlayerStats[] {
  if (!categoryData?.leaders?.[0]?.leaders) return [];

  return categoryData.leaders[0].leaders.map((p: any) => ({
    displayName: p.displayName,
    teamAbbreviation: p.team.abbreviation,
    value: p.value,
    rank: p.rank,
    headshot: p.athlete.headshot,
    id: p.athlete.id,
  }));
}

export function getTopByCategory(categoryAbbreviation: string, limit: number = 20): PlayerStats[] {
  const categoryData = leadersData.categories.find(
    (cat: any) => cat.abbreviation === categoryAbbreviation
  );
  
  if (!categoryData) return [];

  return mapESPNLeaders(categoryData).slice(0, limit);
}

export function getAllLeaderCategories(): LeaderCategory[] {
  return leadersData.categories.map((cat: any) => ({
    name: cat.name,
    abbreviation: cat.abbreviation,
    leaders: mapESPNLeaders(cat),
  }));
}