import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const RSS_FEEDS = [
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nba/' },
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nba/rss' },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/nba/news' }
];

const FAKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/'
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
  if (imgMatch) {
      let url = imgMatch[1];
      if (url.startsWith('//')) url = 'https:' + url;
      return url;
  }
  return null;
}

// ✅ SCRAPER COM REGEX (Zero Dependências, Máxima Compatibilidade)
async function fetchFullArticle(url: string): Promise<{ text: string | null, chars: number }> {
  try {
    console.log(`🌐 Visitando: ${url}`);
    
    const response = await fetch(url, { 
      headers: FAKE_HEADERS,
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`);
      return { text: null, chars: 0 };
    }

    const html = await response.text();
    
    if (html.length < 1000) {
      console.warn(`⚠️ HTML muito pequeno (${html.length} bytes) - Possível bloqueio`);
      return { text: null, chars: 0 };
    }

    // 🔥 REGEX PODEROSA: Extrai o conteúdo dentro de tags <p>
    // Ignora atributos (class, id) e pega o miolo
    const pTagsRegex = /<p[^>]*>(.*?)<\/p>/gis;
    const matches = html.matchAll(pTagsRegex);
    
    const paragraphs: string[] = [];
    for (const match of matches) {
      let text = match[1];

      // Limpeza de Tags HTML internas (links, bold, etc)
      text = text.replace(/<[^>]+>/g, '');
      
      // Limpeza de Entidades HTML comuns
      text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      
      // 🕵️ Filtros de Qualidade: Ignora lixo comum de rodapé/menu
      if (text.length > 50 && 
          !text.toLowerCase().includes('cookie') && 
          !text.toLowerCase().includes('rights reserved') &&
          !text.toLowerCase().includes('privacy policy') &&
          !text.includes('{') && // Evita pedaços de JSON/JS
          !text.includes('function(')) {
        paragraphs.push(text);
      }
    }

    if (paragraphs.length === 0) {
      console.error(`❌ Nenhum parágrafo válido extraído de ${url}`);
      return { text: null, chars: 0 };
    }

    // Junta os parágrafos com quebra de linha dupla
    const fullText = paragraphs.join('\n\n');
    console.log(`✅ Extraído: ${paragraphs.length} parágrafos | ${fullText.length} chars`);
    
    return { text: fullText, chars: fullText.length };

  } catch (error) {
    console.error(`❌ Erro no fetchFullArticle: ${error.message}`);
    return { text: null, chars: 0 };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let allArticles: any[] = [];
    let stats = { total: 0, scraped: 0, failed: 0 };

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`\n📡 === ${feed.name} ===`);
        const response = await fetch(feed.url, { headers: FAKE_HEADERS, signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        // Pega as 8 últimas notícias
        const recentItems = items.slice(0, 8); 
        stats.total += recentItems.length;

        console.log(`📋 ${recentItems.length} itens no RSS`);

        for (const itemXml of recentItems) {
          const title = extractTag(itemXml, 'title');
          const link = extractTag(itemXml, 'link');
          const description = extractTag(itemXml, 'description');
          const image_url = extractImage(itemXml);

          if (!title || !link) continue;

          // Verifica se já existe para não gastar recurso de scraping
          const { data: existing } = await supabase
            .from('articles_queue')
            .select('id')
            .eq('original_link', link)
            .maybeSingle();

          if (existing) {
             console.log(`⏭️ Já existe: ${title.slice(0, 20)}...`);
             continue;
          }

          // 🔥 TENTA O SCRAPING COMPLETO (Texto longo)
          const { text: fullContent, chars } = await fetchFullArticle(link);
          
          if (!fullContent || chars < 200) {
             console.warn(`⚠️ Scraping falhou ou retornou pouco texto. Usando resumo RSS.`);
             stats.failed++;
          } else {
             stats.scraped++;
          }

          // Se o scrape falhar, usa o resumo do RSS como fallback
          const summary = description ? cleanText(description.replace(/<[^>]*>?/gm, '')).slice(0, 400) : '';
          const finalContent = (fullContent && fullContent.length > summary.length) ? fullContent : summary;

          const isInvalidImage = image_url && (image_url.includes('pixel') || image_url.includes('statcounter'));
          const finalImage = (image_url && !isInvalidImage) ? image_url : DEFAULT_IMAGE;

          allArticles.push({
            title: title.slice(0, 200),
            original_title: title.slice(0, 200),
            original_link: link,
            summary: summary,
            original_content: finalContent, // O texto completo vai aqui
            image_url: finalImage,
            source: feed.name,
            status: 'pending_approval',
            created_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error(`Erro no feed ${feed.name}:`, e.message);
      }
    }

    if (allArticles.length > 0) {
        const { error } = await supabase
            .from('articles_queue')
            .upsert(allArticles, { onConflict: 'original_link', ignoreDuplicates: true });
        if (error) throw error;
    }

    console.log(`\n🎉 Finalizado: ${stats.scraped} artigos completos capturados.`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: allArticles.length,
      stats 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});