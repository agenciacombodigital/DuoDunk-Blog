// Script para gerar UM POST CONSOLIDADO com TODOS os resultados da NBA
// Executa diariamente via GitHub Actions às 3h30 AM (Brasília)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 CONFIGURAÇÕES DO SUPABASE (via variáveis de ambiente)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://brerfpcfkyptkzygyzxl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Função para buscar os jogos de ontem
async function buscarJogosOntem() {
  try {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const dia = String(ontem.getDate()).padStart(2, '0');
    const mes = String(ontem.getMonth() + 1).padStart(2, '0');
    const ano = ontem.getFullYear();
    
    console.log(`📅 Buscando jogos finalizados referentes a: ${dia}/${mes}/${ano}`);
    
    const url = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
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
  
  const titulo = `Resultados NBA - ${dataFormatada}`;
  const slug = `resultados-nba-${dataSlug}`;
  
  const resumoJogos = jogos.map(jogo => {
    const timeCasa = jogo.homeTeam;
    const timeVisitante = jogo.awayTeam;
    const placarCasa = timeCasa.score;
    const placarVisitante = timeVisitante.score;
    const vencedor = placarCasa > placarVisitante ? timeCasa.teamTricode : timeVisitante.teamTricode;
    return vencedor;
  }).join(', ');
  
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

  jogos.forEach((jogo, index) => {
    conteudo += gerarSecaoJogo(jogo, index + 1);
  });
  
  conteudo += `
---

**Fonte:** NBA Official Stats  
**Atualizado em:** ${new Date().toLocaleString('pt-BR')}
`;

  return { slug, conteudo };
}

// Função para salvar o post no disco
function salvarPost(slug, conteudo) {
  try {
    const pastaContent = path.join(__dirname, '..', 'content', 'posts');
    
    if (!fs.existsSync(pastaContent)) {
      fs.mkdirSync(pastaContent, { recursive: true });
    }
    
    const nomeArquivo = `${slug}.md`;
    const caminhoArquivo = path.join(pastaContent, nomeArquivo);
    
    fs.writeFileSync(caminhoArquivo, conteudo, 'utf-8');
    
    console.log(`✅ Post consolidado salvo no disco: ${nomeArquivo}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar post no disco:', error);
    return false;
  }
}

// 🚀 NOVA FUNÇÃO: PUBLICAR NO SUPABASE
async function publicarNoSupabase(conteudo) {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
    console.error('⚠️ Configure no GitHub: Settings > Secrets > Actions > SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  try {
    console.log('📤 Enviando post para o Supabase...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/publish-markdown-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        markdownContent: conteudo
      })
    });

    const resultado = await response.json();

    if (response.ok) {
      console.log('✅ Post publicado no Supabase com sucesso!');
      console.log('📊 Resposta:', resultado.message || resultado);
      return true;
    } else {
      console.error('❌ Erro ao publicar no Supabase:', resultado.error || resultado);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição ao Supabase:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🏀 Iniciando geração de post consolidado de resultados da NBA...\n');
  
  // 1. Buscar jogos de ontem
  const { jogos, data } = await buscarJogosOntem();
  
  if (jogos.length === 0) {
    console.log('ℹ️ Nenhum jogo finalizado encontrado para gerar post.');
    return;
  }
  
  // 2. Gerar o post consolidado
  const { slug, conteudo } = gerarPostConsolidado(jogos, data);
  
  // 3. Salvar no disco (para backup/histórico no GitHub)
  const sucessoDisco = salvarPost(slug, conteudo);
  
  // 4. 🚀 PUBLICAR NO SUPABASE (NOVO!)
  const sucessoSupabase = await publicarNoSupabase(conteudo);
  
  if (sucessoDisco && sucessoSupabase) {
    console.log(`\n🎉 Post consolidado gerado e publicado com sucesso!`);
    console.log(`📰 Título: Resultados NBA - ${data.toLocaleDateString('pt-BR')}`);
    console.log(`🏀 Total de jogos: ${jogos.length}`);
    console.log(`✅ Salvo no GitHub: content/posts/${slug}.md`);
    console.log(`✅ Publicado no blog (Supabase)`);
  } else {
    console.log('\n⚠️ Post gerado com problemas:');
    console.log(`- Salvo no disco: ${sucessoDisco ? '✅' : '❌'}`);
    console.log(`- Publicado no blog: ${sucessoSupabase ? '✅' : '❌'}`);
  }
}

// Executa o script
main();