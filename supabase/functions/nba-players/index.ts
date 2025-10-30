import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const TEAM_IDS = [
  '1', '2', '17', '30', '4', '5', '8', '11', '14', '15', '18', '19', '20', '28', '27',
  '6', '7', '9', '10', '12', '13', '29', '16', '3', '25', '21', '22', '23', '24', '26'
];

const fetchRoster = async (teamId: string) => {
  try {
    const response = await fetch(`http://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`);
    if (!response.ok) {
      console.warn(`[Players] Failed to fetch roster for team ${teamId}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Players] Error fetching roster for team ${teamId}:`, error.message);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rosterPromises = TEAM_IDS.map(fetchRoster);
    const rosterResults = await Promise.all(rosterPromises);

    const allPlayers: any[] = [];

    rosterResults.forEach(rosterData => {
      if (rosterData && rosterData.team && rosterData.athletes) {
        const teamInfo = {
          id: rosterData.team.id,
          name: rosterData.team.displayName,
          abbreviation: rosterData.team.abbreviation,
          logo: rosterData.team.logos?.[0]?.href || '',
        };

        rosterData.athletes.forEach((athlete: any) => {
          allPlayers.push({
            id: athlete.id,
            name: athlete.fullName,
            position: athlete.position?.abbreviation || 'N/A',
            jersey: athlete.jersey || '0',
            team: teamInfo,
            headshot: athlete.headshot?.href || '',
          });
        });
      }
    });

    return new Response(JSON.stringify({ success: true, players: allPlayers }), {
      headers: { ...corsHeaders },
      status: 200,
    });

  } catch (error) {
    console.error('Error in nba-players function:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders },
      status: 500,
    });
  }
});