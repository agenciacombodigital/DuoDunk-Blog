import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEASON_YEAR = 2026; // Temporada 2025-26

async function fetchLeadersESPN() {
  const url = `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/leaders`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
  
  const data = await response.json();
  return data;
}

async function run() {
  try {
    console.log('Buscando líderes de estatísticas da ESPN...');
    const leaders = await fetchLeadersESPN();
    
    // Salvar JSON completo
    const contentPath = path.join(__dirname, '..', 'content');
    await fs.ensureDir(contentPath);
    await fs.writeJson(path.join(contentPath, 'nba_leaders_espn.json'), leaders, { spaces: 2 });
    console.log('✅ Dados salvos em ./content/nba_leaders_espn.json');
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
  }
}

run();