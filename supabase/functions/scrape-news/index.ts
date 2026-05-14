import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const RSS_FEEDS = [
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nba/' },
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nba/rss' },
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/nba/news' }
];

const FAKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
  const imgMatch = itemXml.match(/src=["']([^"']+)["']/i);
  if (imgMatch) {
    let url = imgMatch[1];
    if (url.startsWith('//')) url = 'https:' + url;
    return url;
  }
  return null;
}

async function fetchFullArticle(url: string): Promise<{ text: string | null, chars: number }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { headers: FAKE_HEADERS, signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) return { text: null, chars: 0 };
    const html = await response.text();

    const pTagsRegex = /<p[^>]*>(.*?)<\/p>/gis;
    const matches = html.matchAll(pTagsRegex);
    const paragraphs: string[] = [];

    const blacklist = [
      'copyright', 'all rights reserved', 'privacy policy', 'terms of use', 
      'contact us', 'newsletter', 'subscribe', 'login', 'sign up',
      'sports betting', 'gambling problem', 'odds', 'fantasy sports'
    ];

    for (const match of matches) {
      let text = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();

      if (text.length > 80 && 
          !blacklist.some(term => lowerText.includes(term)) && 
          !text.includes('{') && 
          !text.includes('function(') && 
          (text.match(/[A-Z]/g) || []).length < (text.length * 0.4)
      ) {
        paragraphs.push(text);
      }
    }

    if (paragraphs.length === 0) return { text: null, chars: 0 };
    const fullText = paragraphs.join('\n\n');
    return { text: fullText, chars: fullText.length };
  } catch (error) {
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

    console.log("[scrape-news] Iniciando coleta de feeds...");
    let allRawArticles: any[] = [];
    let stats = { total: 0, scraped: 0 };

    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, { headers: FAKE_HEADERS, signal: AbortSignal.timeout(5000) });
        if (!response.ok) return [];

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        const articlesFromFeed: any[] = [];
        
        for (const itemXml of items.slice(0, 3)) {
          const title = extractTag(itemXml, 'title');
          const link = extractTag(itemXml, 'link');
          const description = extractTag(itemXml, 'description');
          const image_url = extractImage(itemXml);

          if (!title || !link) continue;

          articlesFromFeed.push({
            title: title.slice(0, 200),
            original_title: title.slice(0, 200),
            original_link: link,
            summary: description ? cleanText(description.replace(/<[^>]*>?/gm, '')).slice(0, 400) : '',
            image_url: image_url,
            source: feed.name,
            status: 'pending_approval',
            created_at: new Date().toISOString()
          });
        }
        return articlesFromFeed;
      } catch (e: any) {
        console.error(`[scrape-news] Erro feed ${feed.name}:`, e.message);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    allRawArticles = results.flat();

    if (allRawArticles.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhum artigo novo encontrado.' }), { headers: corsHeaders });
    }

    const originalLinks = allRawArticles.map(article => article.original_link);
    const { data: existingArticles, error: existingError } = await supabase
      .from('articles_queue')
      .select('original_link')
      .in('original_link', originalLinks);

    if (existingError) throw existingError;
    const existingLinksSet = new Set(existingArticles?.map(a => a.original_link));
    const articlesToScrape = allRawArticles.filter(article => !existingLinksSet.has(article.original_link));

    if (articlesToScrape.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Todos os artigos encontrados já existem.' }), { headers: corsHeaders });
    }

    let newArticles: any[] = [];
    for (const article of articlesToScrape) {
      const { text: fullContent, chars } = await fetchFullArticle(article.original_link);
      const finalContent = (fullContent && chars > 300) ? fullContent : article.summary;
      if (finalContent.length > article.summary.length) stats.scraped++;

      const isInvalidImage = article.image_url && (article.image_url.includes('pixel') || article.image_url.includes('statcounter'));
      const finalImage = (article.image_url && !isInvalidImage) ? article.image_url : DEFAULT_IMAGE;

      newArticles.push({ ...article, original_content: finalContent, image_url: finalImage });
    }

    if (newArticles.length > 0) {
      const { error } = await supabase.from('articles_queue').upsert(newArticles, { onConflict: 'original_link', ignoreDuplicates: true });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, processed: newArticles.length, scraped_full: stats.scraped }), { headers: corsHeaders });
  } catch (error: any) {
    console.error("[scrape-news] Erro fatal:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: corsHeaders });
  }
});