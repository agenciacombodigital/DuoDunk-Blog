import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import * as cheerio from 'https://esm.sh/cheerio@1.0.0-rc.12';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('PROJECT_URL');
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be defined in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const response = await fetch('https://www.espn.com.br/nba/');
    const html = await response.text();
    const $ = cheerio.load(html);

    const articles: any[] = [];

    $('div.contentItem__content').each((_i, el) => {
      const title = $(el).find('h2.contentItem__title').text().trim();
      const summary = $(el).find('p.contentItem__description').text().trim();
      const link = $(el).find('a.contentItem__anchor').attr('href');
      const imageUrl = $(el).find('img.contentItem__image').attr('src');

      if (title && link && imageUrl) {
        articles.push({ title, summary, link, image_url: imageUrl });
      }
    });

    if (articles.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum artigo encontrado para coletar.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: existingArticles, error: fetchError } = await supabase
      .from('articles_queue')
      .select('link')
      .in('link', articles.map(a => a.link));

    if (fetchError) {
      console.error('Error fetching existing articles:', fetchError);
      throw fetchError;
    }

    const existingLinks = new Set(existingArticles?.map(a => a.link));
    const newArticles = articles.filter(a => !existingLinks.has(a.link));

    if (newArticles.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum novo artigo para adicionar à fila.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { error: insertError } = await supabase
      .from('articles_queue')
      .insert(newArticles.map(article => ({
        ...article,
        status: 'pending',
        created_at: new Date().toISOString(),
      })));

    if (insertError) {
      console.error('Error inserting new articles:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({ message: `Coletados ${newArticles.length} novos artigos e adicionados à fila.` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in scrape-news function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});