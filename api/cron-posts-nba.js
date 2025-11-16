import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Verificar autorização
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🏀 Iniciando geração de posts da NBA...');
    
    // 1. Buscar jogos de ontem
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const dia = String(ontem.getDate()).padStart(2, '0');
    const mes = String(ontem.getMonth() + 1).padStart(2, '0');
    const ano = ontem.getFullYear();
    
    console.log(`📅 Buscando jogos de: ${dia}/${mes}/${ano}`);
    
    const nbaResponse = await fetch('https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json');
    const nbaData = await nbaResponse.json();
    
    const jogosFinalizados = nbaData.scoreboard.games.filter(
      jogo => jogo.gameStatusText === 'Final'
    );
    
    console.log(`✅ Encontrados ${jogosFinalizados.length} jogos finalizados`);
    
    if (jogosFinalizados.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Nenhum jogo finalizado encontrado' 
      });
    }
    
    // 2. Gerar conteúdo Markdown
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const dataSlug = `${ano}-${mes}-${dia}`;
    const titulo = `Resultados NBA - ${dataFormatada}`;
    const slug = `resultados-nba-${dataSlug}`;
    
    let conteudo = `---
title: "${titulo}"
slug: "${slug}"
published: true
publishedat: "${new Date().toISOString()}"
category: "Resultados"
tags: ["NBA", "Resultados", "Rodada"]
imageurl: "https://cdn.nba.com/logos/nba/nba-logoman-75-word_white.svg"
summary: "Confira todos os resultados da rodada da NBA de ${dataFormatada}. ${jogosFinalizados.length} jogos realizados."
---

# ${titulo}

**Total de jogos:** ${jogosFinalizados.length}

Confira abaixo todos os resultados da rodada da NBA realizada em **${dataFormatada}**.

---

`;

    // 3. Adicionar cada jogo
    jogosFinalizados.forEach((jogo, index) => {
      const timeCasa = jogo.homeTeam;
      const timeVisitante = jogo.awayTeam;
      const placarCasa = timeCasa.score;
      const placarVisitante = timeVisitante.score;
      const vencedor = placarCasa > placarVisitante ? timeCasa : timeVisitante;
      const perdedor = placarCasa > placarVisitante ? timeVisitante : timeCasa;
      const placarVencedor = Math.max(placarCasa, placarVisitante);
      const placarPerdedor = Math.min(placarCasa, placarVisitante);
      
      conteudo += `## ${index + 1}. ${vencedor.teamName} ${placarVencedor} x ${placarPerdedor} ${perdedor.teamName}

**${vencedor.teamName}** venceu **${perdedor.teamName}** pelo placar de **${placarVencedor} x ${placarPerdedor}**.

---

`;
    });
    
    conteudo += `
---

**Fonte:** NBA Official Stats  
**Atualizado em:** ${new Date().toLocaleString('pt-BR')}
`;
    
    // 4. Publicar no Supabase
    console.log('📤 Enviando para o Supabase...');
    
    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/publish-markdown-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          markdownContent: conteudo
        })
      }
    );
    
    const supabaseResult = await supabaseResponse.json();
    
    console.log('✅ Resposta do Supabase:', supabaseResult);
    
    return res.status(200).json({
      success: true,
      message: `Post "${titulo}" criado e publicado com sucesso!`,
      jogos: jogosFinalizados.length,
      slug: slug
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}