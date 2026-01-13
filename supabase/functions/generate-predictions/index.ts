import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- CONFIGURAÇÕES ---
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

// ✅ CORREÇÃO: Usando a versão que o cliente confirmou e que apareceu nos logs de cota
const GEMINI_MODEL = "gemini-2.5-flash"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    console.log(`🚀 Iniciando Palpiteiro Batch (${GEMINI_MODEL})...`);

    // 1. LIMPEZA DIÁRIA 
    // Garante que não haja palpites duplicados ou velhos do mesmo dia
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    await supabase.from('daily_games').delete().gte('date', startOfDay);

    // 2. BUSCAR JOGOS (Scoreboard ESPN)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const scoreboardRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${today}`);
    const scoreboardData = await scoreboardRes.json();
    const games = scoreboardData.events || [];

    console.log(`🏀 Jogos encontrados na ESPN: ${games.length}`);

    if (games.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum jogo na rodada hoje." }), { headers: { "Content-Type": "application/json" } });
    }

    // 3. PREPARAR O PROMPT EM LOTE (Batch Processing)
    // Agrupa todos os jogos em uma única string de texto
    const gamesList = games.map((g: any) => {
      const home = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team;
      const away = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team;
      
      const homeRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'home').records?.[0]?.summary || "";
      const awayRecord = g.competitions[0].competitors.find((c: any) => c.homeAway === 'away').records?.[0]?.summary || "";
      
      return `- ID: "${g.id}" | ${home.displayName} (${homeRecord}) vs ${away.displayName} (${awayRecord})`;
    }).join('\n');

    const prompt = `
      Atue como o analista sênior de apostas da NBA (DuoDunk).
      
      TAREFA: Analise a lista de jogos abaixo e preveja o vencedor de CADA UM DELES.
      
      JOGOS DE HOJE:
      ${gamesList}

      REGRAS DE SAÍDA (IMPORTANTE):
      1. Retorne APENAS um Array JSON válido. Não use Markdown (\`\`\`json). Apenas o JSON puro.
      2. Para CADA jogo, gere um objeto com: "id", "vencedor", "confianca" (número 0-100) e "analise".
      3. A "analise" deve ser curta (máx 150 caracteres), citando um fator chave.
      4. Seja decisivo.

      EXEMPLO DE FORMATO:
      [
        { "id": "401810418", "vencedor": "Lakers", "confianca": 82, "analise": "LeBron lidera o ataque." },
        { "id": "401810419", "vencedor": "Celtics", "confianca": 65, "analise": "Mando de quadra decisivo." }
      ]
    `;

    // 4. CHAMADA ÚNICA AO GEMINI (1 Requisição = Economia de Cota)
    console.log("🤖 Enviando requisição única (Batch)...");
    
    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         contents: [{ parts: [{ text: prompt }] }],
         generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error("Erro Gemini API:", errorText);
        throw new Error(`Erro Gemini API: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    let aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) throw new Error("IA não retornou texto.");

    // Limpeza de segurança do JSON (caso a IA mande markdown)
    aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const predictions = JSON.parse(aiResponseText);

    console.log(`✅ IA gerou ${predictions.length} palpites.`);

    // 5. SALVAR NO BANCO (Loop local, muito rápido)
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

      // Insert do Palpite
      if (gameDb) {
        await supabase.from('predictions').insert({
          game_id: gameDb.id,
          prediction_title: `${pred.vencedor} Vence`,
          prediction_analysis: pred.analise,
          confidence_score: pred.confianca,
          ai_model: GEMINI_MODEL
        });
        savedGames.push(pred.vencedor);
      }
    }

    return new Response(JSON.stringify({ success: true, count: savedGames.length, palpites: savedGames }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("❌ Erro Geral:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});