import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AMAZON_AFFILIATE_LINK = "https://amzn.to/3KaOGB9";

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

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("Buscando jogos na ESPN Brasil...");
    const espnUrl = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?lang=pt&region=br";
    const espnRes = await fetch(espnUrl);
    const espnData = await espnRes.json();
    
    const jogos = espnData.events || [];
    if (jogos.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo hoje" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Processar Jogos
    const listaJogosTexto = jogos.map((jogo: any) => {
      const timeCasa = jogo.competitions[0].competitors.find((c: any) => c.homeAway === 'home').team.displayName;
      const timeVisitante = jogo.competitions[0].competitors.find((c: any) => c.homeAway === 'away').team.displayName;
      const broadcasts = jogo.competitions[0].broadcasts || [];
      const canais = broadcasts.map((b: any) => b.names[0]).join(", ");
      return `- ${timeVisitante} @ ${timeCasa} (Transmissão: ${canais || 'League Pass'})`;
    }).join("\n");

    // Gerar Intro com IA
    console.log("Gerando texto com Gemini...");
    const prompt = `
      Atue como um jornalista esportivo especialista em NBA do blog "DuoDunk".
      Hoje teremos os seguintes jogos:
      ${listaJogosTexto}

      Escreva uma introdução curta (2 parágrafos) e empolgante para o post "Onde assistir NBA hoje".
      Destaque os jogos que terão transmissão na TV Brasileira (ESPN, Amazon, Vivo, Disney+).
      Use um tom informal e apaixonado por basquete.
    `;

    const result = await model.generateContent(prompt);
    const introTexto = result.response.text();

    // Montar HTML
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    let htmlBody = `<p>${introTexto.replace(/\n/g, '</p><p>')}</p>`;
    htmlBody += `<h3>Confira a agenda completa desta rodada:</h3>`;
    htmlBody += `<ul class="wp-block-list">`;

    const tags = ["NBA Hoje", "Onde Assistir NBA", "Agenda NBA"];

    jogos.forEach((jogo: any) => {
      const timeCasa = jogo.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
      const timeVisitante = jogo.competitions[0].competitors.find((c: any) => c.homeAway === 'away');
      const date = new Date(jogo.date);
      const horario = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      
      const broadcasts = jogo.competitions[0].broadcasts || [];
      const canais = broadcasts.map((b: any) => b.names[0]);
      
      let canalFormatado = "League Pass";
      let icon = "📲"; 
      
      const temTransmissaoBR = canais.some((c: string) => /ESPN|Star|Disney|Amazon|Vivo|YouTube/i.test(c));
      
      if (temTransmissaoBR) {
        const canaisFiltrados = canais.filter((c: string) => !c.includes("NBA")); 
        let canaisTexto = canaisFiltrados.length > 0 ? canaisFiltrados.join(" / ") : canais.join(" / ");
        
        // MONETIZAÇÃO AMAZON
        if (/Amazon|Prime/i.test(canaisTexto)) {
             canaisTexto = canaisTexto.replace(/(Amazon Prime Video|Amazon|Prime Video)/gi, `<a href="${AMAZON_AFFILIATE_LINK}" target="_blank" rel="noopener noreferrer" style="color: #00A8E1; font-weight: bold; text-decoration: underline;">$1 (Teste Grátis)</a>`);
        }
        canalFormatado = canaisTexto;
        icon = "📺"; 
      }

      htmlBody += `<li><strong>${horario}</strong> – ${timeVisitante.team.displayName} @ ${timeCasa.team.displayName} – ${icon} ${canalFormatado}</li>`;
      tags.push(timeCasa.team.displayName);
      tags.push(timeVisitante.team.displayName);
    });

    htmlBody += `</ul>`;
    htmlBody += `<p><em>* Horários de Brasília.</em></p>`;
    
    // CTA MONETIZAÇÃO FINAL
    htmlBody += `<p style="margin-top: 20px; padding: 15px; background-color: #f0f8ff; border-left: 5px solid #00A8E1;">
      <strong>Dica DuoDunk:</strong> Ainda não tem Amazon Prime? 
      <a href="${AMAZON_AFFILIATE_LINK}" target="_blank" rel="noopener noreferrer">Clique aqui para testar 30 dias grátis</a> 
      e assistir aos jogos da NBA ao vivo! 🏀
    </p>`;

    const dataSlug = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const slug = `onde-assistir-nba-hoje-${dataSlug}`;
    
    const { error } = await supabase.from('articles_queue').insert([{
        title: `Onde assistir NBA hoje (${dataHoje})`,
        summary: `Confira a programação completa da NBA para hoje.`,
        body: htmlBody,
        tags: [...new Set(tags)], 
        slug: slug,
        source: 'DuoDunk Agenda',
        image_url: 'https://duodunk.com.br/images/agenda-nba-padrao.jpg', 
        status: 'processed', 
        created_at: new Date().toISOString()
    }]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});