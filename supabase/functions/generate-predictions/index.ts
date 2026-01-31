import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// Modelo atualizado para performance e estabilidade
const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    console.log(`🚀 Iniciando Palpiteiro (Modo Direto)...`);

    // 1. DEFINIR DATA DA RODADA (Fuso Horário BR ou UTC tratado)
    // Usamos YYYYMMDD para a ESPN
    const todayDate = new Date();
    const formattedDateESPN = todayDate.toISOString().split('T')[0].replace(/-/g, ''); // Ex: 20260131
    const formattedDateDB = todayDate.toISOString().split('T')[0]; // Ex: 2026-01-31

    console.log(`📅 Processando rodada: ${formattedDateDB}`);

    // 2. LIMPEZA CIRÚRGICA
    // Deleta apenas os jogos desta data específica para evitar duplicidade na visualização
    // O filtro 'like' garante que pegue qualquer hora do dia (2026-01-31%)
    await supabase.from('daily_games').delete().like('date', `${formattedDateDB}%`);

    // 3. BUSCAR JOGOS (Scoreboard ESPN)
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${formattedDateESPN}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    console.log(`🏀 Jogos encontrados: ${games.length}`);

    if (games.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum jogo na rodada de hoje." }), { headers: { "Content-Type": "application/json" } });
    }

    // 4. PREPARAR O PROMPT EM LOTE
    const gamesList = games.map((g: any) => {
      const home = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;
      
      const homeRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').records?.[0]?.summary || "0-0";
      const awayRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').records?.[0]?.summary || "0-0";
      
      return `- ID: "${g.id}" | JOGO: ${home.displayName} (${homeRecord}) vs ${away.displayName} (${awayRecord})`;
    }).join('\n');

    // Prompt ajustado para: Sem justificativa longa, considerar momento/elenco
    const prompt = `
      Atue como especialista em NBA (DuoDunk).
      
      TAREFA: Preveja o vencedor para cada jogo da lista abaixo.
      
      CRITÉRIOS DE ANÁLISE:
      1. Considere a campanha atual (Record).
      2. Considere o mando de quadra.
      3. Considere a força teórica dos elencos titulares e estrelas disponíveis.
      
      LISTA DE JOGOS:
      ${gamesList}

      REGRAS DE SAÍDA (JSON PURO):
      1. Retorne APENAS um Array JSON.
      2. Campos: "id", "titulo" (Ex: "Lakers Vence"), "confianca" (0-100).
      3. NÃO escreva justificativa ou análise. O foco é o resultado direto.

      EXEMPLO:
      [
        { "id": "401810418", "titulo": "Lakers Vence", "confianca": 82 },
        { "id": "401810419", "titulo": "Celtics Vence", "confianca": 65 }
      ]
    `;

    // 5. CHAMADA ÚNICA AO GEMINI
    console.log("🤖 Consultando IA...");
    
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         contents: [{ parts: [{ text: prompt }] }],
         generationConfig: { temperature: 0.1, responseMimeType: "application/json" } // Temp baixa para ser mais "lógico" e menos criativo
      })
    });

    if (!geminiRes.ok) throw new Error(`Erro Gemini API: ${geminiRes.status}`);

    const geminiData = await geminiRes.json();
    let aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) throw new Error("IA não retornou texto.");

    const predictions = JSON.parse(aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim());

    // 6. SALVAR NO BANCO
    const savedGames = [];

    for (const pred of predictions) {
      const originalGame = games.find((g: any) => g.id === pred.id);
      if (!originalGame) continue;

      const home = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = originalGame.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;

      // Upsert do Jogo
      const { data: gameDb, error: gameError } = await supabase.from('daily_games').upsert({
        espn_game_id: pred.id,
        date: originalGame.date,
        home_team_id: home.id,
        home_team_name: home.displayName,
        home_team_logo: home.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${home.abbreviation?.toLowerCase()}.png`,
        visitor_team_id: away.id,
        visitor_team_name: away.displayName,
        visitor_team_logo: away.logo || `https://a.espncdn.com/i/teamlogos/nba/500/${away.abbreviation?.toLowerCase()}.png`
      }, { onConflict: 'espn_game_id' }).select().single();

      if (gameError) {
          console.error(`Erro banco (Jogo ${pred.id}):`, gameError);
          continue;
      }

      // Insert do Palpite (Sem descrição longa)
      if (gameDb) {
        await supabase.from('predictions').insert({
          game_id: gameDb.id,
          prediction_title: pred.titulo, // Ex: "Lakers Vence"
          prediction_analysis: "Probabilidade calculada com base em retrospecto e elenco.", // Texto padrão curto
          confidence_score: pred.confianca,
          ai_model: GEMINI_MODEL
        });
        savedGames.push(pred.titulo);
      }
    }

    return new Response(JSON.stringify({ success: true, count: savedGames.length, palpites: savedGames }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});