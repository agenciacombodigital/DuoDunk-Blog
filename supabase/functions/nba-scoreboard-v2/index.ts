import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Usando a URL padrão da NBA para placares de hoje
    const nbaApiUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
    
    const response = await fetch(nbaApiUrl, {
      headers: {
        'Accept': 'application/json',
        // Adicionando User-Agent para simular um navegador e evitar bloqueios
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

    if (!response.ok) {
      console.error(`[nba-scoreboard-v2] NBA API request failed with status ${response.status}`);
      throw new Error(`NBA API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    const gameCount = data?.scoreboard?.games?.length || 0;
    console.log(`[nba-scoreboard-v2] Fetched data successfully. Found ${gameCount} games.`);

    return new Response(JSON.stringify({ success: true, scoreboard: data.scoreboard }), {
      headers: { ...corsHeaders },
      status: 200,
    });
  } catch (error) {
    console.error('Error in nba-scoreboard-v2 function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});