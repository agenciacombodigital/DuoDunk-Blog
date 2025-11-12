import { GameBoxScore, TeamBoxScore, PlayerStats } from '../services/nbaBoxScore';

/**
 * Gera post em Markdown no estilo Jumper Brasil
 */
export function gerarPostResultado(boxScores: GameBoxScore[]): string {
  if (boxScores.length === 0) return '';

  const jogoDestaque = boxScores[0]; // Primeiro jogo como destaque
  const outrosJogos = boxScores.slice(1);

  const markdown = `
# ${gerarTituloPost(jogoDestaque)}

**Rodada de ${formatarData(jogoDestaque.gameDate)} ainda contou com ${listarOutrosVencedores(outrosJogos)}**

![Imagem do jogo](https://cdn.nba.com/teams/${jogoDestaque.homeTeam.teamAbbr}/photos/game-action.jpg)

${gerarNarrativaJogo(jogoDestaque)}

## Escalações

${gerarTextoEscalacoes(jogoDestaque)}

## Destaques

${gerarTextoDestaques(jogoDestaque)}

---

## ${jogoDestaque.awayTeam.record} ${jogoDestaque.awayTeam.teamName} ${jogoDestaque.awayTeam.score} x ${jogoDestaque.homeTeam.score} ${jogoDestaque.homeTeam.teamName} ${jogoDestaque.homeTeam.record}

### ${jogoDestaque.awayTeam.teamName}

${gerarTabelaEstatisticas(jogoDestaque.awayTeam)}

**Três pontos:** ${jogoDestaque.awayTeam.teamThreePt} / ${jogoDestaque.awayTeam.topThreePointShooter}

### ${jogoDestaque.homeTeam.teamName}

${gerarTabelaEstatisticas(jogoDestaque.homeTeam)}

**Três pontos:** ${jogoDestaque.homeTeam.teamThreePt} / ${jogoDestaque.homeTeam.topThreePointShooter}

---

## Outros Resultados da Noite

${gerarResumoOutrosJogos(outrosJogos)}

---

**Leia mais:**
${gerarLinksRelacionados(boxScores)}
`;

  return markdown;
}

/**
 * Gera tabela HTML/Markdown com estatísticas dos jogadores
 */
function gerarTabelaEstatisticas(team: TeamBoxScore): string {
  return `
| Jogador | PTS | REB | AST | STL | BLK |
|---------|-----|-----|-----|-----|-----|
${team.players.map(p => 
  `| ${p.nome} | ${p.pts} | ${p.reb} | ${p.ast} | ${p.stl} | ${p.blk} |`
).join('\n')}
`;
}

/**
 * Gera título chamativo baseado no jogo
 */
function gerarTituloPost(boxScore: GameBoxScore): string {
  const vencedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.homeTeam 
    : boxScore.awayTeam;
  
  const perdedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.awayTeam 
    : boxScore.homeTeam;

  const estrela = vencedor.players[0]; // Maior pontuador
  const diferenca = Math.abs(vencedor.score - perdedor.score);

  if (diferenca > 20) {
    return `${estrela.nome} brilha e ${vencedor.teamName} atropela ${perdedor.teamName}`;
  } else if (diferenca <= 5) {
    return `${vencedor.teamName} vence ${perdedor.teamName} em jogo eletrizante`;
  } else {
    return `Com ${estrela.pts} pontos de ${estrela.nome}, ${vencedor.teamName} supera ${perdedor.teamName}`;
  }
}

/**
 * Gera narrativa do jogo baseada nas estatísticas
 */
function gerarNarrativaJogo(boxScore: GameBoxScore): string {
  const vencedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.homeTeam 
    : boxScore.awayTeam;
  
  const perdedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.awayTeam 
    : boxScore.homeTeam;

  const mvp = vencedor.players[0];
  const apoio = vencedor.players[1];

  return `O ${vencedor.teamName} venceu o ${perdedor.teamName} por ${vencedor.score} a ${perdedor.score} na noite desta ${formatarDiaSemana(boxScore.gameDate)}. 

**${mvp.nome}** liderou a vitória com **${mvp.pts} pontos**, além de contribuir com **${mvp.reb} rebotes** e **${mvp.ast} assistências**. ${apoio.nome} também teve papel importante, somando ${apoio.pts} pontos.

Pelo lado do ${perdedor.teamName}, ${perdedor.players[0].nome} foi o destaque com ${perdedor.players[0].pts} pontos, mas não foi suficiente para evitar a derrota.

Com o resultado, ${vencedor.teamName} chega a **${vencedor.record}** na temporada, enquanto ${perdedor.teamName} cai para **${perdedor.record}**.`;
}

/**
 * Gera texto sobre as escalações
 */
function gerarTextoEscalacoes(boxScore: GameBoxScore): string {
  // Verifica se há jogadores suficientes para evitar erros
  if (boxScore.homeTeam.players.length === 0 || boxScore.awayTeam.players.length === 0) {
    return 'Informações de escalação não disponíveis.';
  }
  
  const homePlayer = boxScore.homeTeam.players[0];
  const awayPlayer = boxScore.awayTeam.players[0];

  return `O técnico do ${boxScore.homeTeam.teamName} escalou ${homePlayer.nome} como destaque, que respondeu com ${homePlayer.pts} pontos. 

Já o ${boxScore.awayTeam.teamName} contou com ${awayPlayer.nome} no quinteto inicial, que anotou ${awayPlayer.pts} pontos na partida.`;
}

/**
 * Gera análise dos destaques do jogo
 */
function gerarTextoDestaques(boxScore: GameBoxScore): string {
  const vencedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.homeTeam 
    : boxScore.awayTeam;
  
  if (vencedor.players.length === 0) return 'Destaques não disponíveis.';

  const mvp = vencedor.players[0];
  
  // Encontrar melhor assistente
  const melhorAssistente = vencedor.players.reduce((prev, curr) => 
    curr.ast > prev.ast ? curr : prev
  );

  // Encontrar melhor reboteiro
  const melhorReboteiro = vencedor.players.reduce((prev, curr) => 
    curr.reb > prev.reb ? curr : prev
  );

  return `**${mvp.nome}** foi o grande nome da partida. O jogador comandou a vitória com autoridade, mostrando eficiência nos arremessos: ${mvp.fg} nos arremessos de quadra e ${mvp.threePt} nas bolas de três.

${melhorAssistente.nome} também merece destaque pelas **${melhorAssistente.ast} assistências**, orquestrando bem o ataque.

No garrafão, ${melhorReboteiro.nome} dominou com **${melhorReboteiro.reb} rebotes**, garantindo segundas chances de posse para sua equipe.`;
}

/**
 * Gera resumo dos outros jogos
 */
function gerarResumoOutrosJogos(boxScores: GameBoxScore[]): string {
  return boxScores.map(bs => {
    const vencedor = bs.homeTeam.score > bs.awayTeam.score ? bs.homeTeam : bs.awayTeam;
    const perdedor = bs.homeTeam.score > bs.awayTeam.score ? bs.awayTeam : bs.homeTeam;
    
    // Verifica se há jogadores suficientes
    const destaque = vencedor.players[0];
    const pts = destaque ? destaque.pts : 'N/D';
    const reb = destaque ? destaque.reb : 'N/D';
    const ast = destaque ? destaque.ast : 'N/D';
    const nome = destaque ? destaque.nome : 'Destaque não encontrado';

    return `**${vencedor.teamName} ${vencedor.score} x ${perdedor.score} ${perdedor.teamName}**
- Destaque: ${nome} (${pts} pts, ${reb} reb, ${ast} ast)`;
  }).join('\n\n');
}

/**
 * Lista vencedores dos outros jogos para o subtítulo
 */
function listarOutrosVencedores(boxScores: GameBoxScore[]): string {
  const vencedores = boxScores.map(bs => {
    const vencedor = bs.homeTeam.score > bs.awayTeam.score ? bs.homeTeam : bs.awayTeam;
    return vencedor.teamName;
  });

  if (vencedores.length === 0) return 'nenhum outro jogo';
  if (vencedores.length === 1) return `a vitória de ${vencedores[0]}`;
  if (vencedores.length === 2) return `as vitórias de ${vencedores[0]} e ${vencedores[1]}`;
  
  const ultimos = vencedores.slice(-2);
  const primeiros = vencedores.slice(0, -2);
  return `as vitórias de ${primeiros.join(', ')}, ${ultimos[0]} e ${ultimos[1]}`;
}

/**
 * Gera links relacionados (últimas notícias dos times)
 */
function gerarLinksRelacionados(boxScores: GameBoxScore[]): string {
  const links = new Set<string>();
  boxScores.forEach(bs => {
    links.add(`- [Mais sobre ${bs.homeTeam.teamName}](/times/${bs.homeTeam.teamAbbr.toLowerCase()})`);
    links.add(`- [Mais sobre ${bs.awayTeam.teamName}](/times/${bs.awayTeam.teamAbbr.toLowerCase()})`);
  });
  return Array.from(links).join('\n');
}

/**
 * Formata data para português
 */
function formatarData(isoDate: string): string {
  const data = new Date(isoDate);
  const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
  return `${dias[data.getDay()]}, ${data.getDate()} de ${meses[data.getMonth()]}`;
}

function formatarDiaSemana(isoDate: string): string {
  const data = new Date(isoDate);
  const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return dias[data.getDay()];
}

export { gerarTabelaEstatisticas };