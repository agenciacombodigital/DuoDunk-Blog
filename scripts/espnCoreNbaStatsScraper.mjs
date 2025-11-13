import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para buscar todos os atletas da temporada atual (2025-26)
const SEASON_YEAR = 2026; // Temporada 2025-26
const LIMIT = 50; // Número de jogadores no ranking que você quer salvar

async function fetchAthletes() {
  const url = `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/seasons/${SEASON_YEAR}/athletes`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`Erro: ${res.statusText}`);
  return await res.json();
}

// Buscar detalhes de um atleta individual, incluindo estatísticas
async function fetchAthleteDetails(athleteUrl) {
  const res = await fetch(athleteUrl, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`Erro: ${res.statusText}`);
  return await res.json();
}

async function main() {
  try {
    console.log("Buscando lista de atletas NBA...");
    const athletesData = await fetchAthletes();

    // 'items' é um array de urls de atletas
    const athleteUrls = athletesData.items.map(a => a.$ref);

    const statsArray = [];

    // Atenção: para muitos jogadores, talvez limitar para os 50 primeiros inicialmente
    for (let i = 0; i < Math.min(LIMIT, athleteUrls.length); i++) {
      const url = athleteUrls[i];
      try {
        const athlete = await fetchAthleteDetails(url);
        statsArray.push({
          id: athlete.id,
          name: athlete.fullName,
          team: athlete.team?.shortDisplayName || "",
          position: athlete.position?.abbreviation || "",
          jersey: athlete.jersey || "",
          headshot: athlete.headshot?.href || "",
          stats: athlete.stats?.splits?.categories || [], // stats gerais
        });
        console.log(`✔️ ${athlete.fullName}`);
      } catch (err) {
        console.warn(`Erro ao buscar atleta [${url}]: ${err.message}`);
      }
    }

    const outputPath = path.join(__dirname, "../content/nba_stats_espncore.json");
    await fs.writeJson(outputPath, statsArray, { spaces: 2 });
    console.log(`✅ Stats salvas em ${outputPath}`);
  } catch (err) {
    console.error("❌ Erro geral:", err);
  }
}

main();