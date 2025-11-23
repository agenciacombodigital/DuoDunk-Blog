import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar as últimas 50 notícias publicadas
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const siteUrl = "https://www.duodunk.com.br";
    const feedUrl = `${siteUrl}/feed.xml`;

    // Cabeçalho do RSS
    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>DuoDunk - Notícias da NBA</title>
    <link>${siteUrl}</link>
    <description>As últimas notícias, resultados e análises do mundo da NBA.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>DuoDunk</title>
      <link>${siteUrl}</link>
    </image>
`;

    // Adicionar cada artigo como um item
    articles.forEach((article) => {
      const articleUrl = `${siteUrl}/artigos/${article.slug}`;
      const pubDate = new Date(article.published_at).toUTCString();
      
      // Tratamento da imagem (se houver)
      let mediaTag = "";
      if (article.image_url) {
        // Tenta adivinhar o tipo de imagem pela extensão ou usa jpeg padrão
        const type = article.image_url.endsWith(".png") ? "image/png" : "image/jpeg";
        mediaTag = `<enclosure url="${article.image_url}" length="0" type="${type}" />`;
      }

      // Limpeza básica do HTML do corpo para evitar quebrar o XML
      // O CDATA protege o conteúdo HTML
      const contentEncoded = `<![CDATA[
        ${article.image_url ? `<img src="${article.image_url}" alt="${article.title}" />` : ""}
        ${article.body || article.summary}
      ]]>`;

      rss += `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${article.summary || ""}]]></description>
      <content:encoded>${contentEncoded}</content:encoded>
      <dc:creator>DuoDunk Redação</dc:creator>
      ${mediaTag}
    </item>`;
    });

    rss += `
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache de 1 hora
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});