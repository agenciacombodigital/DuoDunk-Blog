const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');

// Parâmetros da temporada
const SEASON = "2025-26";
const SEASON_TYPE = "Regular Season";

// Mapeamento dos tipos de estatística, personalize se quiser mais
const STAT_CATEGORIES = ["PTS", "REB", "AST", "STL", "BLK", "FG3M"];

async function fetchLeaders(stat) {
  const url = `https://stats.nba.com/stats/leagueLeaders?LeagueID=00&Season=${SEASON}&SeasonType=${encodeURIComponent(SEASON_TYPE)}&StatCategory=${stat}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.nba.com/',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.nba.com'
  };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erro ao buscar ${stat}: ${res.statusText}`);
  const data = await res.json();
  return data;
}

async function run() {
  const allStats = {};
  for (const stat of STAT_CATEGORIES) {
    try {
      const leaders = await fetchLeaders(stat);
      allStats[stat] = leaders;
      console.log(`Baixou stats: ${stat}`);
    } catch (err) {
      console.error(`Erro em ${stat}:`, err.message);
    }
  }
  
  const contentPath = path.join(__dirname, '..', 'content');
  await fs.ensureDir(contentPath); // Garante que a pasta content existe
  
  await fs.writeJson(path.join(contentPath, 'nba_leaders.json'), allStats, { spaces: 2 });
  console.log('Arquivo nba_leaders.json salvo em ./content/');
}

run();