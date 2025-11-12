import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import axios from 'https://esm.sh/axios@1.7.2';

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Faz a requisição à API da ESPN (que não tem CORS)
    const response = await axios.get(`${ESPN_API_BASE}/leaders`);

    // Retorna a resposta da ESPN através do proxy, com CORS habilitado
    return new Response(JSON.stringify(response.data), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-stats-proxy function:', error.message);
    return new Response(JSON.stringify({ success: false, error: 'Erro ao buscar estatísticas da ESPN via proxy.' }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});