// Script para gerar posts de resultados da NBA automaticamente
// Executa diariamente via GitHub Actions às 3h30 AM (horário de Brasília)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para buscar os jogos de ontem
async function buscarJogosOntem() {
  try {
    // Calcula a data de ontem
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const ano = ontem.getFullYear();
    const mes = String(ontem.getMonth() + 1).padStart(2, '0');
    const dia = String(ontem.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}${mes}${dia}`;
    
    console.log(`📅 Buscando jogos do dia: ${dia}/${mes}/${ano}`);
    
    // URL da API da NBA para os jogos do dia
    const url = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Filtra apenas jogos finalizados
    const jogosFinalizados = data.scoreboard.games.filter(
      jogo => jogo.gameStatusText === 'Final'
    );
    
    console.log(`✅ Encontrados ${jogosFinalizados.length} jogos finalizados`);
    
    return jogosFinalizados;
  } catch (error) {
    console.error('❌ Erro ao buscar jogos:', error);
    return [];
  }
}

// Função para gerar o conteúdo do post em Markdown
function gerarConteudoPost(jogo) {
  const timeCasa = jogo.homeTeam;
  const timeVisitante = jogo.awayTeam;
  
  const placarCasa = timeCasa.score;
  const placarVisitante = timeVisitante.score;
  
  const vencedor = placarCasa > placarVisitante ? timeCasa.teamName : timeVisitante.teamName;
  const perdedor = placarCasa > placarVisitante ? timeVisitante.teamName : timeCasa.teamName;
  
  // Data do jogo
  const dataJogo = new Date(jogo.gameTimeUTC);
  const dataFormatada = dataJogo.toLocaleDateString('pt-BR');
  
  // Título do post
  const titulo = `${vencedor} vence ${perdedor} por ${Math.max(placarCasa, placarVisitante)} x ${Math.min(placarCasa, placarVisitante)}`;
  
  // Slug (URL amigável)
  const slug = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  // Conteúdo Markdown
  const conteudo = `---
title: "${titulo}"
slug: "${slug}"
published: true
publishedat: "${new Date().toISOString()}"
category: "Resultados"
tags: ["NBA", "${timeCasa.teamTricode}", "${timeVisitante.teamTricode}", "Resultados"]
imageurl: "https://cdn.nba.com/logos/nba/${timeCasa.teamId}/primary/L/logo.svg"
summary: "${vencedor} derrotou ${perdedor} em partida válida pela NBA."
---

# ${titulo}

**Data do jogo:** ${dataFormatada}

## Placar Final

| Time | Q1 | Q2 | Q3 | Q4 | Total |
|------|----|----|----|----|-------|
| **${timeCasa.teamName}** | - | - | - | - | **${placarCasa}** |
| **${timeVisitante.teamName}** | - | - | - | - | **${placarVisitante}** |

---

## Destaque da Partida

Em partida emocionante da NBA, **${vencedor}** venceu **${perdedor}** pelo placar de **${Math.max(placarCasa, placarVisitante)} x ${Math.min(placarCasa, placarVisitante)}**.

---

## Estatísticas Principais

*Estatísticas detalhadas serão adicionadas em breve.*

---

**Fonte:** NBA Official Stats
`;

  return { slug, conteudo };
}

// Função para salvar o post
function salvarPost(slug, conteudo) {
  try {
    // Caminho da pasta de posts
    const pastaContent = path.join(__dirname, '..', 'content', 'posts');
    
    // Cria a pasta se não existir
    if (!fs.existsSync(pastaContent)) {
      fs.mkdirSync(pastaContent, { recursive: true });
    }
    
    // Nome do arquivo
    const nomeArquivo = `${slug}.md`;
    const caminhoArquivo = path.join(pastaContent, nomeArquivo);
    
    // Salva o arquivo
    fs.writeFileSync(caminhoArquivo, conteudo, 'utf-8');
    
    console.log(`✅ Post salvo: ${nomeArquivo}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar post:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🏀 Iniciando geração de posts de resultados da NBA...\n');
  
  // Busca os jogos de ontem
  const jogos = await buscarJogosOntem();
  
  if (jogos.length === 0) {
    console.log('ℹ️ Nenhum jogo finalizado encontrado para gerar posts.');
    return;
  }
  
  // Gera um post para cada jogo
  let postsGerados = 0;
  
  for (const jogo of jogos) {
    const { slug, conteudo } = gerarConteudoPost(jogo);
    const sucesso = salvarPost(slug, conteudo);
    
    if (sucesso) {
      postsGerados++;
    }
  }
  
  console.log(`\n🎉 Processo finalizado! ${postsGerados} posts gerados com sucesso!`);
}

// Executa o script
main();
