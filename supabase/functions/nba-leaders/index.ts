import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// URL base da API da ESPN
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

// Função para processar os dados de líderes da ESPN
const processarLideres = (categoria: any): any[] => {
  if (!categoria?.leaders) return [];
  
  return categoria.leaders.slice(0, 5).map((lider: any) => {
    const athlete = lider.athlete;
    const team = lider.team;
    
    // Encontra o valor da estatística, que pode estar em 'value' ou dentro de 'statistics'
    let statValue = lider.value;
    if (lider.statistics) {
        const statName = categoria.name;
        const statEntry = lider.statistics.find((s: any) => s.name === statName);
        if (statEntry) {
            statValue = statEntry.value;
        }
    }

    return {
      id: athlete.id,
      nome: athlete.displayName,
      time: team.name,
      siglaTime: team.abbreviation,
      logoTime: team.logos?.[0]?.href || '',
      posicao: athlete.position?.abbreviation || 'N/A',
      valor: statValue, // Valor da estatística
      foto: athlete.headshot?.href || ''
    };
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("[nba-leaders] Buscando dados da ESPN...");
    
    const response = await fetch(`${ESPN_API_BASE}/leaders`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`ESPN API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.categories) {
        return new Response(JSON.stringify({ success: true, leaders: {} }), {
            headers: { ...corsHeaders },
            status: 200,
        });
    }

    const categorias = data.categories;
    
    const leaders = {
      pontos: processarLideres(categorias.find((c: any) => c.name === 'avgPoints')),
      rebotes: processarLideres(categorias.find((c: any) => c.name === 'avgRebounds')),
      assistencias: processarLideres(categorias.find((c: any) => c.name === 'avgAssists')),
      roubos: processarLideres(categorias.find((c: any) => c.name === 'avgSteals')),
      tocos: processarLideres(categorias.find((c: any) => c.name === 'avgBlocks')),
      triplos: processarLideres(categorias.find((c: any) => c.name === 'avgThreePointFieldGoalsMade'))
    };

    console.log("[nba-leaders] Dados processados com sucesso.");

    return new Response(JSON.stringify({ success: true, leaders }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-leaders function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});