import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://esm.sh/linkedom@0.14.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Seletores CSS para encontrar o texto em cada site
const RSS_FEEDS = [
  { name: 'ESPN', url: 'https://www.espn.com/espn/rss/nba/news', selector: '.article-body p' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nba/', selector: '.Article-bodyContent p' },
  { name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nba/rss', selector: '.caas-body p' }
];

// Headers para fingir ser um navegador real (evita bloqueio)
const FAKE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
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

// ✅ FUNÇÃO NOVA: Visita o link e baixa o texto completo
async function fetchFullArticle(url: string, selector: string): Promise<string | null> {
  try {
    console.log(`🌍 Visitando: ${url}`);
    
    const response = await fetch(url, { 
      headers: FAKE_HEADERS,
      signal: AbortSignal.timeout(15000) // Timeout de 15s
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status} em ${url}`);
      return null;
    }

    const html = await response.text();
    const { document } = new DOMParser().parseFromString(html, 'text/html');

    // Busca todos os parágrafos dentro do seletor do site
    const paragraphs = Array.from(document.querySelectorAll(selector))
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 40); // Ignora textos muito curtos (legendas, ads)

    if (paragraphs.length === 0) {
      console.warn(`⚠️ Nenhum texto encontrado com seletor "${selector}" em ${url}`);
      return null;
    }

    // Junta tudo com quebra de linha
    const fullText = paragraphs.join('\n\n');
    console.log(`✅ Sucesso: ${fullText.length} caracteres extraídos.`);
    
    return fullText;

  } catch (error) {
    console.error(`❌ Falha ao extrair ${url}:`, error.message);
    return null;
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

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`📡 Lendo Feed: ${feed.name}`);
        const response = await fetch(feed.url, { headers: FAKE_HEADERS, signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;

        const xmlText = await response.text();
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        // Processa apenas os 3 mais recentes para não estourar o tempo da Edge Function
        const recentItems = items.slice(0, 3); 

        for (const itemXml of recentItems) {
          const title = extractTag(itemXml, 'title');
          const link = extractTag(itemXml, 'link');
          const description = extractTag(itemXml, 'description');
          const image_url = extractImage(itemXml);

          if (!title || !link) continue;

          // Verifica se já existe antes de fazer o scrape (economiza recursos)
          const { data: existing } = await supabase
            .from('articles_queue')
            .select('id')
            .eq('original_link', link)
            .maybeSingle();

          if (existing) {
             console.log(`⏭️ Já existe: ${title.slice(0, 30)}...`);
             continue;
          }

          // 🔥 A MÁGICA ACONTECE AQUI: Busca o texto completo
          const fullContent = await fetchFullArticle(link, feed.selector);
          
          // Se falhar o scrape, usa o resumo do RSS como fallback
          const summary = description ? cleanText(description.replace(/<[^>]*>?/gm, '')).slice(0, 400) : '';
          const finalContent = fullContent || summary;

          const isInvalidImage = image_url && (image_url.includes('pixel') || image_url.includes('statcounter'));
          const finalImage = (image_url && !isInvalidImage) ? image_url : DEFAULT_IMAGE;

          allArticles.push({
            title: title.slice(0, 200),
            original_title: title.slice(0, 200),
            original_link: link,
            summary: summary, // Resumo curto
            original_content: finalContent, // ✅ TEXTO COMPLETO
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

    return new Response(JSON.stringify({ success: true, processed: allArticles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});