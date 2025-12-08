import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const RSS_FEEDS = [
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/nba/news' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nba/' },
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nba/rss' } 
];

const FAKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
};

const DEFAULT_IMAGE = "https://duodunk.com.br/images/agenda-nba-padrao.jpg";

const cleanText = (str: string) => str ? str.trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/\s+/g, ' ') : '';

function extractTag(itemXml: string, tagName: string) {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)</${tagName}>`, 'is');
  const match = itemXml.match(regex);
  return match ? cleanText(match[1]) : null;
}

function extractImage(itemXml: string) {
  const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (enclosureMatch) return enclosureMatch[1];
  const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch) return mediaMatch[1];
  const imgMatch = itemXml.match(/src=["']([^"']+\.(jpg|jpeg|png|webp))["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let allArticles: any[] = [];

    // 1. Coleta
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`--- Buscando em: ${feed.name} ---`);
        const response = await fetch(feed.url, { headers: FAKE_HEADERS, signal: AbortSignal.timeout(10000) });
        
        if (!response.ok) {
          console.error(`Erro HTTP ${feed.name}: ${response.status}`);
          continue;
        }

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        const recentItems = items.slice(0, 8); 

        console.log(`${feed.name}: Encontrou ${recentItems.length} itens.`);

        for (const itemXml of recentItems) {
          const title = extractTag(itemXml, 'title');
          const link = extractTag(itemXml, 'link');
          const description = extractTag(itemXml, 'description');
          const image_url = extractImage(itemXml);

          if (title && link) {
            const summary = description ? cleanText(description.replace(/<[^>]*>?/gm, '')).slice(0, 400) : '';
            const finalImage = image_url || DEFAULT_IMAGE;

            allArticles.push({
              title: title.slice(0, 200),
              original_title: title.slice(0, 200),
              original_link: link,
              summary: summary,
              image_url: finalImage,
              source: feed.name,
              status: 'pending_approval',
              created_at: new Date().toISOString()
            });
          }
        }
      } catch (e) {
        console.error(`Falha na fonte ${feed.name}:`, e.message);
      }
    }

    console.log(`Tentando salvar ${allArticles.length} artigos...`);

    // 2. Salvamento Inteligente (Upsert)
    const { data, error } = await supabase
        .from('articles_queue')
        .upsert(allArticles, { 
            onConflict: 'original_link', 
            ignoreDuplicates: true 
        })
        .select();

    if (error) throw error;

    // Como ignoreDuplicates não retorna count preciso de inserções, retornamos o total processado
    return new Response(JSON.stringify({ 
      success: true, 
      found: allArticles.length,
      message: `Processamento finalizado. O banco filtrou as duplicatas automaticamente.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});