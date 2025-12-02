import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AMAZON_AFFILIATE_LINK = "https://amzn.to/3KaOGB9";
const GEMINI_MODEL = "gemini-2.5-flash"; 

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY não encontrada.");

    // 1. Data BRASIL
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    
    const dataHojePT = `${day}/${month}/${year}`; 
    const dateParam = `${year}${month}${day}`;
    const dataISO = `${year}-${month}-${day}`;

    console.log(`[AutoAgenda] Iniciando para: ${dataHojePT}`);

    // 2. ESPN
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?lang=pt&region=br&dates=${dateParam}`;
    const espnRes = await fetch(espnUrl);
    if (!espnRes.ok) throw new Error(`Erro ESPN: ${espnRes.status}`);
    const espnData = await espnRes.json();
    const jogos = espnData.events || [];

    if (jogos.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "Nenhum jogo hoje" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Prompt Gemini
    const listaJogosTexto = jogos.map((jogo: any) => {
      const comp = jogo.competitions[0];
      const timeCasa = comp.competitors.find((c: any) => c.homeAway === 'home').team.displayName;
      const timeVisitante = comp.competitors.find((c: any) => c.homeAway === 'away').team.displayName;
      const broadcasts = comp.broadcasts || [];
      const canais = broadcasts.map((b: any) => b.names[0]).join(", ");
      const dateObj = new Date(jogo.date);
      const hora = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      return `- ${hora}: ${timeVisitante} @ ${timeCasa} (${canais || 'League Pass'})`;
    }).join("\n");

    const prompt = `
      Atue como jornalista do DuoDunk. Data: ${dataHojePT}.
      Jogos:
      ${listaJogosTexto}
      Escreva lead curto (2 parágrafos) sobre a rodada. Destaque transmissões. Tom empolgante.
    `;

    const genAiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const genAiRes = await fetch(genAiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const genAiData = await genAiRes.json();
    const introTexto = genAiData.candidates?.[0]?.content?.parts?.[0]?.text || `Confira os jogos de hoje.`;

    // 4. Montar HTML (SEM LINKS NA LISTA)
    let htmlBody = `<p>${introTexto.replace(/\n/g, '</p><p>')}</p>`;
    htmlBody += `<h3>Agenda de Hoje (${dataHojePT}):</h3><ul class="wp-block-list">`;

    const tags = ["NBA Hoje", "Agenda NBA"];

    jogos.forEach((jogo: any) => {
      const comp = jogo.competitions[0];
      const timeCasa = comp.competitors.find((c: any) => c.homeAway === 'home');
      const timeVisitante = comp.competitors.find((c: any) => c.homeAway === 'away');
      const dateObj = new Date(jogo.date);
      const horario = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      
      const broadcasts = comp.broadcasts || [];
      const canais = broadcasts.map((b: any) => b.names[0]);
      
      let canalFormatado = "League Pass";
      let icon = "📲"; 
      
      const temTransmissaoBR = canais.some((c:string) => /ESPN|Star|Disney|Amazon|Vivo|YouTube/i.test(c));

      if (temTransmissaoBR) {
          const canaisFiltrados = canais.filter((c: string) => !c.includes("NBA")); 
          // ✅ REMOVIDA A CRIAÇÃO DE LINKS AQUI. APENAS TEXTO.
          canalFormatado = canaisFiltrados.length > 0 ? canaisFiltrados.join(" / ") : canais.join(" / ");
          icon = "📺"; 
      }

      htmlBody += `<li><strong>${horario}</strong> – ${timeVisitante.team.displayName} x ${timeCasa.team.displayName} – ${icon} ${canalFormatado}</li>`;
      tags.push(timeCasa.team.displayName);
      tags.push(timeVisitante.team.displayName);
    });

    htmlBody += `</ul><p><em>* Horários de Brasília.</em></p>`;
    
    // Banner Amazon (Link Único)
    htmlBody += `<p style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-left: 5px solid #00A8E1;"><strong>Dica DuoDunk:</strong> <a href="${AMAZON_AFFILIATE_LINK}" target="_blank">Teste Amazon Prime Grátis</a>!</p>`;

    // 5. Salvar ou Atualizar
    const linkUnico = `https://www.espn.com.br/nba/calendario?date=${dateParam}`;
    const slug = `onde-assistir-nba-hoje-${dataISO}`;
    
    // ✅ CORREÇÃO: Usar o SLUG como identificador único na fila
    const { data: existing } = await supabase.from('articles_queue').select('id').eq('slug', slug).maybeSingle();

    const articleData = {
        title: `Onde assistir NBA hoje (${dataHojePT})`,
        original_title: `Onde assistir NBA hoje (${dataHojePT})`,
        original_link: linkUnico,
        summary: `Programação da NBA para ${dataHojePT}.`,
        body: htmlBody,
        tags: [...new Set(tags)],
        slug: slug,
        source: 'DuoDunk Agenda',
        image_url: 'https://duodunk.com.br/images/agenda-nba-padrao.jpg',
        status: 'processed', // Garante que volta para a lista
        created_at: new Date().toISOString(),
        is_featured: false,
        author: 'Fernando Balley' // Autor definido
    };

    if (existing) {
        console.log("Atualizando registro existente...");
        // Atualiza o registro existente
        const { error: updateError } = await supabase.from('articles_queue').update(articleData).eq('id', existing.id);
        if (updateError) throw updateError;
    } else {
        console.log("Criando novo registro...");
        // Cria um novo registro
        const { error: insertError } = await supabase.from('articles_queue').insert([articleData]);
        if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});