import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// URL da função que busca histórico do time
const NBA_TEAM_INFO_URL = `${SUPABASE_URL}/functions/v1/nba-team-info`; 

// MODELO ATUALIZADO (2026): Gemini 2.5 Flash
const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    // 1. Limpeza Automática (Garbage Collection)
    // Remove jogos com mais de 5 dias para economizar espaço
    await supabase.from('daily_games').delete().lt('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());

    // 2. Buscar Jogos de Hoje na ESPN
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    const predictionsGenerated = [];

    // 3. Loop pelos jogos do dia
    for (const game of games) {
      const gameId = game.id; 
      const competidores = game.competitions[0].competitors;
      const homeTeam = competidores.find((c: any) => c.homeAway === 'home').team;
      const awayTeam = competidores.find((c: any) => c.homeAway === 'away').team;

      // Verifica no Supabase se já geramos palpite hoje para esse ID
      const { data: existing } = await supabase.from('daily_games').select('id').eq('espn_game_id', gameId).maybeSingle();
      
      if (existing) {
        continue; // Se já existe, pula para o próximo
      }

      // 4. Buscar Contexto Avançado (Chama a função nba-team-info existente)
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` 
      };

      // Dispara as duas requisições em paralelo
      const [homeStats, awayStats] = await Promise.all([
        fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: homeTeam.id }) }).then(r => r.json()),
        fetch(NBA_TEAM_INFO_URL, { method: 'POST', headers, body: JSON.stringify({ teamId: awayTeam.id }) }).then(r => r.json())
      ]);

      // 5. Montar o Prompt para o Gemini 2.5
      const prompt = `
        Atue como o analista sênior de apostas do portal DuoDunk (Especialista em NBA).
        
        CONFRONTO: ${homeTeam.displayName} (Casa) vs ${awayTeam.displayName} (Visitante).
        
        DADOS DO MANDANTE (${homeTeam.displayName}):
        - Campanha Atual: ${homeStats.record?.wins || 0} Vitórias - ${homeStats.record?.losses || 0} Derrotas.
        - Sequência Atual: ${homeStats.record?.streak || 'N/A'}.
        - Últimos 5 Jogos: ${homeStats.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-') || 'Sem dados'}.
        
        DADOS DO VISITANTE (${awayTeam.displayName}):
        - Campanha Atual: ${awayStats.record?.wins || 0} Vitórias - ${awayStats.record?.losses || 0} Derrotas.
        - Sequência Atual: ${awayStats.record?.streak || 'N/A'}.
        - Últimos 5 Jogos: ${awayStats.pastGames?.map((g: any) => g.homeTeam.winner ? 'V' : 'D').join('-') || 'Sem dados'}.

        SUA MISSÃO:
        Analise o "momentum" das equipes e gere um palpite estratégico.
        
        FORMATO DE RESPOSTA (JSON Obrigatório):
        {
          "palpite": "Ex: Lakers Vence ou Over 220.5",
          "analise": "Texto curto e vibrante (max 2 frases) explicando o motivo, citando dados recentes.",
          "confianca": 85
        }
      `;

      // 6. Chamar API Gemini 2.5 Flash
      const geminiRes = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json"
          }
        })
      });
      
      const geminiData = await geminiRes.json();
      
      if (!geminiData.candidates || !geminiData.candidates[0]) {
        console.error(`Erro Gemini no jogo ${gameId}:`, geminiData);
        continue;
      }

      const rawText = geminiData.candidates[0].content.parts[0].text;
      const aiResult = JSON.parse(rawText);

      // 7. Salvar tudo no Banco (Supabase)
      const { data: gameDb, error: gameError } = await supabase.from('daily_games').insert({
        espn_game_id: gameId,
        date: game.date, 
        home_team_id: homeTeam.id,
        home_team_name: homeTeam.displayName,
        visitor_team_id: awayTeam.id,
        visitor_team_name: awayTeam.displayName
      }).select().single();

      if (gameError) {
        console.error("Erro ao salvar jogo:", gameError);
        continue;
      }

      if (gameDb) {
        await supabase.from('predictions').insert({
          game_id: gameDb.id,
          prediction_title: aiResult.palpite,
          prediction_analysis: aiResult.analise,
          confidence_score: aiResult.confianca,
          ai_model: GEMINI_MODEL
        });
        predictionsGenerated.push(`${homeTeam.displayName} vs ${awayTeam.displayName}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Palpites gerados para ${predictionsGenerated.length} jogos.`,
        games: predictionsGenerated 
      }), 
      { 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});