import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://esm.sh/linkedom@0.14.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Seletores robustos (Múltiplas tentativas por site)
const RSS_FEEDS = [
  { 
    name: 'CBS Sports', 
    url: 'https://www.cbssports.com/rss/headlines/nba/',
    selectors: ['.Article-bodyContent p', 'article p', '.article-content p', '[data-component="ArticleBody"] p']
  },
  { 
    name: 'Yahoo Sports', 
    url: 'https://sports.yahoo.com/nba/rss',
    selectors: ['.caas-body p', 'article p', '.article-body p']
  },
  { 
    name: 'ESPN', 
    url: 'https://www.espn.com/espn/rss/nba/news',
    selectors: ['.article-body p', 'article p', '.story p']
  }
];

const FAKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.google.com/',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
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

// Scraper Inteligente com Diagnóstico
async function fetchFullArticle(url: string, selectors: string[]): Promise<{ text: string | null, stats: any }> {
  try {
    console.log(`\n🌐 Visitando: ${url}`);
    
    const response = await fetch(url, { 
      headers: FAKE_HEADERS,
      signal: AbortSignal.timeout(20000) // 20s timeout
    });

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}`);
      return { text: null, stats: { error: `HTTP ${response.status}` } };
    }

    const html = await response.text();
    
    if (html.length < 500) {
      console.warn(`⚠️ HTML suspeito (${html.length} bytes) - Possível bloqueio`);
      return { text: null, stats: { error: 'HTML vazio/bloqueado', size: html.length } };
    }

    const { document } = new DOMParser().parseFromString(html, 'text/html');

    let paragraphs: string[] = [];
    let selectorUsed = '';

    // Tenta cada seletor da lista
    for (const selector of selectors) {
      const found = Array.from(document.querySelectorAll(selector))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 40);

      if (found.length > 0) {
        paragraphs = found;
        selectorUsed = selector;
        console.log(`✅ Seletor "${selector}" funcionou: ${found.length} parágrafos`);
        break;
      }
    }

    // Fallback: Se nenhum funcionou, pega todos os <p> da página
    if (paragraphs.length === 0) {
      console.warn(`⚠️ Seletores falharam. Tentando fallback genérico...`);
      const allParagraphs = Array.from(document.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 60);
      
      if (allParagraphs.length > 3) {
        paragraphs = allParagraphs;
        selectorUsed = 'fallback:p';
        console.log(`⚠️ Fallback funcionou: ${paragraphs.length} parágrafos.`);
      } else {
        return { text: null, stats: { error: 'Nenhum texto encontrado' } };
      }
    }

    const fullText = paragraphs.join('\n\n');
    return { 
      text: fullText, 
      stats: { selector: selectorUsed, chars: fullText.length } 
    };

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return { text: null, stats: { error: error.message } };
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
    let diagnostics: any[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`\n📡 === ${feed.name} ===`);
        const response = await fetch(feed.url, { headers: FAKE_HEADERS, signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        // Pega as 8 últimas notícias
        const recentItems = items.slice(0, 8);

        console.log(`📋 ${recentItems.length} itens no feed RSS`);

        for (const itemXml of recentItems) {
          const title = extractTag(itemXml, 'title');
          const link = extractTag(itemXml, 'link');
          const description = extractTag(itemXml, 'description');
          const image_url = extractImage(itemXml);

          if (!title || !link) continue;

          // Verifica se já existe
          const { data: existing } = await supabase
            .from('articles_queue')
            .select('id')
            .eq('original_link', link)
            .maybeSingle();

          if (existing) {
             console.log(`⏭️ Já existe: ${title.slice(0, 20)}...`);
             continue;
          }

          // 🔥 SCRAPING PROFUNDO
          const { text: fullContent, stats } = await fetchFullArticle(link, feed.selectors);
          
          diagnostics.push({ title: title.slice(0, 30), stats });

          const summary = description ? cleanText(description.replace(/<[^>]*>?/gm, '')).slice(0, 400) : '';
          const finalContent = fullContent || summary; // Usa o texto completo se tiver, senão o resumo

          const isInvalidImage = image_url && (image_url.includes('pixel') || image_url.includes('statcounter'));
          const finalImage = (image_url && !isInvalidImage) ? image_url : DEFAULT_IMAGE;

          allArticles.push({
            title: title.slice(0, 200),
            original_title: title.slice(0, 200),
            original_link: link,
            summary: summary,
            original_content: finalContent, // Guardando o ouro aqui
            image_url: finalImage,
            source: feed.name,
            status: 'pending_approval',
            created_at: new Date().toISOString()
          });

          console.log(`💾 Pronto para salvar: ${finalContent.length} chars.`);
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

    console.log(`\n🎉 Total salvos: ${allArticles.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: allArticles.length,
      diagnostics 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});