"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

/**
 * Aprova um artigo da fila e o publica na tabela 'articles'.
 * Revalida o cache da Home e da página de artigos.
 */
export async function approveAndPublishArticleServer(article: any) {
  try {
    // 1. Limpar destaques antigos se o novo for destaque
    if (article.is_featured) {
      console.log('Desmarcando destaques antigos...');
      const { error: clearError } = await supabaseAdmin
        .from('articles')
        .update({ is_featured: false })
        .eq('is_featured', true);
      if (clearError) console.warn('⚠️ Erro ao limpar destaques:', clearError);
    }

    // 2. Preparar dados para inserção
    const articleData = {
      title: article.title,
      body: article.body,
      slug: article.slug,
      published: true,
      published_at: new Date().toISOString(),
      summary: article.summary || '',
      meta_description: article.meta_description || article.summary || article.title.substring(0, 160),
      tags: Array.isArray(article.tags) ? article.tags : [],
      image_url: article.image_url || '',
      source: article.source || 'DuoDunk',
      author: article.author || 'Duo Dunk Redação',
      ...(article.queue_id && { queue_id: article.queue_id }),
      ...(article.original_link && { original_link: article.original_link }),
      ...(article.video_url && { video_url: article.video_url }),
      ...(article.subtitle && { subtitle: article.subtitle }),
      is_featured: article.is_featured || false,
      views: 0,
      image_focal_point: article.image_focal_point || '50% 50%',
      image_focal_point_mobile: article.image_focal_point_mobile || '50%',
    };

    // 3. Inserir na tabela 'articles'
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('articles')
      .insert(articleData)
      .select();
      
    if (insertError) throw insertError;
    if (!insertedData || insertedData.length === 0) throw new Error('Artigo não foi criado. INSERT vazio!');

    // 4. Atualizar status na fila
    const { error: updateError } = await supabaseAdmin
      .from('articles_queue')
      .update({ status: 'approved' })
      .eq('id', article.id);
      
    if (updateError) console.warn('⚠️ Erro ao atualizar fila:', updateError);

    // 5. Revalidar o cache do Next.js
    revalidatePath('/'); // Home Page
    revalidatePath('/ultimas'); // Últimas Notícias
    revalidatePath(`/artigos/${article.slug}`); // Página do Artigo
    
    console.log(`✅ Artigo ${article.slug} publicado e cache revalidado.`);

    return { success: true, slug: article.slug };
  } catch (error: any) {
    console.error('Erro ao publicar artigo (Server Action):', error.message);
    return { success: false, error: error.message, code: error.code };
  }
}