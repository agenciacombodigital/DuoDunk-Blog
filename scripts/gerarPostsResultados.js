// Script para gerar UM POST CONSOLIDADO com TODOS os resultados da NBA
// Executa diariamente via GitHub Actions às 5h AM (UTC)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Adicionando import do fetch

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para buscar os jogos de ontem
async function buscarJogosOntem() {
  try {
    // Calcula a data de ontem
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const dia = String(ontem.getDate()).padStart(2, '0');
    const mes = String(ontem.getMonth() + 1).padStart(2, '0');
    const ano = ontem.getFullYear();
    
    console.log(`📅 Buscando jogos finalizados referentes a: ${dia}/${mes}/${ano}`);
    
    // URL da API da NBA para os jogos do dia (usamos o placar de 'hoje' e filtramos por 'Final')
    const url = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Filtra apenas jogos finalizados
    const jogosFinalizados = data.scoreboard.games.filter(
      jogo => jogo.gameStatusText === 'Final'
    );
    
    console.log(`✅ Encontrados ${jogosFinalizados.length} jogos finalizados`);
    
    return { jogos: jogosFinalizados, data: ontem };
  } catch (error) {
    console.error('❌ Erro ao buscar jogos:', error);
    return { jogos: [], data: new Date() };
  }
}

// Função para gerar seção de um jogo individual
function gerarSecaoJogo(jogo, index) {
  const timeCasa = jogo.homeTeam;
  const timeVisitante = jogo.awayTeam;
  
  const placarCasa = timeCasa.score;
  const placarVisitante = timeVisitante.score;
  
  const vencedor = placarCasa > placarVisitante ? timeCasa : timeVisitante;
  const perdedor = placarCasa > placarVisitante ? timeVisitante : timeCasa;
  const placarVencedor = Math.max(placarCasa, placarVisitante);
  const placarPerdedor = Math.min(placarCasa, placarVisitante);
  
  // Seção do jogo em Markdown
  return `## ${index}. ${vencedor.teamName} ${placarVencedor} x ${placarPerdedor} ${perdedor.teamName}

**${vencedor.teamName}** venceu **${perdedor.teamName}** pelo placar de **${placarVencedor} x ${placarPerdedor}**.

### Placar por Período

| Time | Q1 | Q2 | Q3 | Q4 | Total |
|------|----|----|----|----|-------|
| **${timeVisitante.teamName}** | - | - | - | - | **${placarVisitante}** |
| **${timeCasa.teamName}** | - | - | - | - | **${placarCasa}** |

### Destaques

*Estatísticas detalhadas dos principais jogadores serão adicionadas em breve.*

---
`;
}

// Função para gerar o conteúdo do post consolidado
function gerarPostConsolidado(jogos, data) {
  const dataFormatada = data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const dataSlug = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  
  // Título do post
  const titulo = `Resultados NBA - ${dataFormatada}`;
  
  // Slug (URL amigável)
  const slug = `resultados-nba-${dataSlug}`;
  
  // Gera resumo dos jogos
  const resumoJogos = jogos.map(jogo => {
    const timeCasa = jogo.homeTeam;
    const timeVisitante = jogo.awayTeam;
    const placarCasa = timeCasa.score;
    const placarVisitante = timeVisitante.score;
    const vencedor = placarCasa > placarVisitante ? timeCasa.teamTricode : timeVisitante.teamTricode;
    return vencedor;
  }).join(', ');
  
  // Monta o conteúdo completo
  let conteudo = `---
title: "${titulo}"
slug: "${slug}"
published: true
publishedat: "${new Date().toISOString()}"
category: "Resultados"
tags: ["NBA", "Resultados", "Rodada"]
imageurl: "https://cdn.nba.com/logos/nba/nba-logoman-75-word_white.svg"
summary: "Confira todos os resultados da rodada da NBA de ${dataFormatada}. ${jogos.length} jogos realizados."
---

# ${titulo}

**Total de jogos:** ${jogos.length}

Confira abaixo todos os resultados da rodada da NBA realizada em **${dataFormatada}**.

---

`;

  // Adiciona cada jogo como uma seção
  jogos.forEach((jogo, index) => {
    conteudo += gerarSecaoJogo(jogo, index + 1);
  });
  
  // Rodapé
  conteudo += `
---

**Fonte:** NBA Official Stats  
**Atualizado em:** ${new Date().toLocaleString('pt-BR')}
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
    
    console.log(`✅ Post consolidado salvo: ${nomeArquivo}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar post:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🏀 Iniciando geração de post consolidado de resultados da NBA...\n');
  
  // Busca os jogos de ontem
  const { jogos, data } = await buscarJogosOntem();
  
  if (jogos.length === 0) {
    console.log('ℹ️ Nenhum jogo finalizado encontrado para gerar post.');
    return;
  }
  
  // Gera o post consolidado
  const { slug, conteudo } = gerarPostConsolidado(jogos, data);
  
  // Salva o post
  const sucesso = salvarPost(slug, conteudo);
  
  if (sucesso) {
    console.log(`\n🎉 Post consolidado gerado com sucesso!`);
    console.log(`📰 Título: Resultados NBA - ${data.toLocaleDateString('pt-BR')}`);
    console.log(`🏀 Total de jogos: ${jogos.length}`);
  } else {
    console.log('\n❌ Falha ao gerar o post consolidado.');
  }
}

// Executa o script
main();