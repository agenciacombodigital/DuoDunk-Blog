import { supabase } from './supabase';

/**
 * ✅ FUNÇÃO PARA REPROCESSAR ARTIGOS QUE FALHARAM POR RATE LIMIT
 * 
 * Deve ser chamada periodicamente (ex: a cada 5 minutos) ou manualmente
 * quando o administrador quiser retentar processar artigos pendentes
 */
export async function retryRateLimitedArticles() {
  try {
    console.log('🔄 Verificando artigos com rate limit...');

    // ✅ BUSCAR ARTIGOS QUE FALHARAM POR RATE LIMIT E JÁ PASSARAM DO TEMPO DE ESPERA
    // Nota: Esta função usa o cliente normal (anon key), mas como está no admin,
    // assumimos que o usuário está autenticado e tem permissão via RLS/Policy.
    const { data: articles, error: fetchError } = await supabase
      .from('articles_queue')
      .select('id, original_title, retry_after')
      .eq('status', 'rate_limited')
      .lte('retry_after', new Date().toISOString()) // Só pega os que já podem ser retentados
      .order('retry_after', { ascending: true })
      .limit(5); // Processa no máximo 5 por vez para evitar novo rate limit

    if (fetchError) {
      console.error('❌ Erro ao buscar artigos:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!articles || articles.length === 0) {
      console.log('ℹ️ Nenhum artigo pronto para reprocessar');
      return { success: true, message: 'Nenhum artigo pronto para reprocessar', processed: 0 };
    }

    console.log(`📋 Encontrados ${articles.length} artigos para reprocessar`);

    let successCount = 0;
    let failCount = 0;

    // ✅ REPROCESSAR CADA ARTIGO
    for (const article of articles) {
      try {
        console.log(`🔄 Reprocessando: ${article.original_title?.substring(0, 50)}...`);

        // ✅ VOLTAR STATUS PARA 'PENDING_APPROVAL' PARA SER PEGO PELA EDGE FUNCTION
        const { error: updateError } = await supabase
          .from('articles_queue')
          .update({
            status: 'pending_approval',
            retry_after: null
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar artigo ${article.id}:`, updateError);
          failCount++;
          continue;
        }

        successCount++;
        
        // ✅ DELAY DE 2 SEGUNDOS ENTRE CADA ARTIGO PARA EVITAR NOVO RATE LIMIT
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ Erro ao processar artigo ${article.id}:`, error.message);
        failCount++;
      }
    }

    console.log(`✅ Reprocessamento concluído: ${successCount} sucesso, ${failCount} falhas`);

    return {
      success: true,
      processed: successCount,
      failed: failCount,
      total: articles.length
    };

  } catch (error: any) {
    console.error('❌ Erro geral:', error.message);
    return { success: false, error: error.message };
  }
}