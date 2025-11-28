"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

import AdminActions from '@/components/admin/AdminActions';
import AdminStats from '@/components/admin/AdminStats';
import PendingApprovalSection from '@/components/admin/PendingApprovalSection';
import PendingProcessingSection from '@/components/admin/PendingProcessingSection';
import PublishedArticlesSection from '@/components/admin/PublishedArticlesSection';
import EditArticleModal from '@/components/admin/EditArticleModal';
import AutoApprovedSection from '@/components/admin/AutoApprovedSection';
import { retryRateLimitedArticles } from '@/lib/retryRateLimitedArticles';
import { useAuth } from '@/hooks/useAuth';
import { clearAllFeaturedArticlesServer, getRateLimitStatsServer } from '@/services/adminActions'; // Importando Server Actions

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [published, setPublished] = useState<any[]>([]);
  const [rateLimitStats, setRateLimitStats] = useState({ total: 0, ready_to_retry: 0, still_waiting: 0 });
  const [localLoading, setLocalLoading] = useState(true);

  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      loadData();
    }
  }, [isAdmin, isLoading]);

  const loadData = async () => {
    setLocalLoading(true);
    try {
      await loadQueue();
      await loadPublished();
      await loadRateLimitStats();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from('articles_queue')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setQueue(data || []);
  };

  const loadPublished = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published_at, source, views')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) throw error;
    setPublished(data || []);
  };
  
  const loadRateLimitStats = async () => {
    // Usando a Server Action para buscar stats
    const stats = await getRateLimitStatsServer();
    if (stats.success) {
      setRateLimitStats(stats);
    }
  };

  // --- NOVO: Acionar o Robô da Agenda ---
  const handleAutoAgenda = async () => {
    const toastId = toast.loading("🤖 Robô criando a agenda...");
    try {
      const { error } = await supabase.functions.invoke('auto-rodada-nba');
      if (error) throw error;
      
      toast.success("Agenda criada! Verifique a fila.", { id: toastId });
      await loadQueue();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro no robô', { id: toastId, description: error.message });
    }
  };
  // --------------------------------------

  const scrape = async () => {
    setIsScraping(true);
    const toastId = toast.loading("Coletando notícias...");
    try {
      const { data, error } = await supabase.functions.invoke('scrape-news');
      if (error) throw error;
      toast.success("Coleta finalizada!", { id: toastId, description: data.message });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao coletar', { id: toastId, description: error.message });
    }
    setIsScraping(false);
  };

  const processOneWithAI = async () => {
    setIsProcessing(true);
    const toastId = toast.loading("Processando com IA...");
    try {
      const { data, error } = await supabase.functions.invoke('process-with-ai');
      if (error) throw error;
      if (data.message?.includes('removido da fila')) {
        toast.info("Artigo inválido removido", { id: toastId, description: data.message });
      } else {
        toast.success("Processamento finalizado!", { id: toastId, description: data.message });
      }
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.error('Erro ao processar', { id: toastId, description: error.message });
    }
    setIsProcessing(false);
  };
  
  const handleRetryRateLimited = async () => {
    setIsRetrying(true);
    const toastId = toast.loading("Retentando artigos com Rate Limit...");
    try {
      // Esta função usa o cliente normal, então pode ser chamada diretamente
      const result = await retryRateLimitedArticles();
      if (result.success) {
        if (result.processed > 0) {
          toast.success(`✅ ${result.processed} artigos marcados para reprocessamento!`, { id: toastId });
        } else {
          toast.info("Nenhum artigo pronto para retentar.", { id: toastId });
        }
      } else {
        throw new Error(result.error);
      }
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao retentar', { id: toastId, description: error.message });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleImageUpload = async (articleId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens!');
      return;
    }
    setUploadingImage(articleId);
    const toastId = toast.loading("Fazendo upload da imagem...");
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `public/${articleId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('article-images').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('article-images').getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error("URL da imagem não encontrada.");
      const { error: updateError } = await supabase.from('articles_queue').update({ image_url: data.publicUrl }).eq('id', articleId);
      if (updateError) throw updateError;
      if (editingArticle && editingArticle.id === articleId) {
        setEditingArticle((prev: any) => ({ ...prev, image_url: data.publicUrl }));
      }
      toast.success('Imagem atualizada!', { id: toastId });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro no upload', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFocalPointCommit = async (articleId: string, focalPoints: [string, string]) => {
    const [desktopFocalPoint, mobileFocalPoint] = focalPoints;
    const { error } = await supabase
      .from('articles_queue')
      .update({ 
        image_focal_point: desktopFocalPoint,
        image_focal_point_mobile: mobileFocalPoint,
      })
      .eq('id', articleId);
    if (error) {
      toast.error('Erro ao salvar o foco da imagem.');
      loadQueue();
    }
  };

  const handleFocalPointChange = (articleId: string, focalPoints: [string, string]) => {
    const [desktopFocalPoint, mobileFocalPoint] = focalPoints;
    setQueue(prevQueue =>
      prevQueue.map(a =>
        a.id === articleId ? { 
          ...a, 
          image_focal_point: desktopFocalPoint,
          image_focal_point_mobile: mobileFocalPoint,
        } : a
      )
    );
  };

  const approveArticle = async (article: any) => {
    if (!window.confirm('Aprovar e publicar este artigo?')) return;
    const toastId = toast.loading("Publicando artigo...");
    try {
      if (article.is_featured) {
        // Usando a Server Action para limpar destaques
        await clearAllFeaturedArticlesServer();
      }
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
        ...(article.queue_id && { queue_id: article.queue_id }),
        ...(article.original_link && { original_link: article.original_link }),
        ...(article.video_url && { video_url: article.video_url }),
        ...(article.subtitle && { subtitle: article.subtitle }),
        is_featured: article.is_featured || false,
        views: 0,
        image_focal_point: article.image_focal_point || '50% 50%',
        image_focal_point_mobile: article.image_focal_point_mobile || '50%',
      };
      // Usando o cliente normal para inserir (RLS deve estar desativado na tabela articles para admins)
      const { data: insertedData, error: insertError } = await supabase.from('articles').insert(articleData).select();
      if (insertError) throw insertError;
      if (!insertedData || insertedData.length === 0) throw new Error('Artigo não foi criado. INSERT vazio!');
      
      console.log(`✅ Artigo publicado com sucesso: ${insertedData[0].id}`); // Adicionando log de sucesso
      
      const { error: updateError } = await supabase.from('articles_queue').update({ status: 'approved' }).eq('id', article.id);
      if (updateError) console.warn('⚠️ Erro ao atualizar fila:', updateError);
      
      toast.success('Artigo publicado! 🚀', { id: toastId });
      await loadData();
      setShowEditModal(false);
    } catch (error: any) {
      console.error('❌ ERRO:', error);
      if (error.code === '23505') {
        toast.error('Slug Duplicado', { id: toastId, description: 'Este slug já existe. Edite o título ou slug.' });
      } else {
        toast.error('Erro ao publicar', { id: toastId, description: error.message });
      }
    }
  };

  const handleToggleFeatured = async (articleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('articles_queue').update({ is_featured: !currentStatus }).eq('id', articleId);
      if (error) throw error;
      toast.success(!currentStatus ? '⭐ Marcado como destaque!' : '✓ Destaque removido');
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao atualizar destaque', { description: error.message });
    }
  };

  const rejectArticle = async (articleId: string) => {
    if (!window.confirm('Rejeitar este artigo? Ele será movido para a lixeira.')) return;
    const toastId = toast.loading("Rejeitando artigo...");
    try {
      await supabase.from('articles_queue').update({ status: 'rejected' }).eq('id', articleId);
      toast.info('Artigo rejeitado.', { id: toastId });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao rejeitar', { id: toastId, description: error.message });
    }
  };

  const deleteFromQueue = async (articleId: string) => {
    if (!window.confirm('DELETAR este artigo da fila permanentemente? Esta ação é irreversível.')) return;
    const toastId = toast.loading("Deletando artigo da fila...");
    try {
      await supabase.from('articles_queue').delete().eq('id', articleId);
      toast.success('Artigo deletado da fila.', { id: toastId });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao deletar', { id: toastId, description: error.message });
    }
  };

  const deletePublishedArticle = async (articleId: string) => {
    if (!window.confirm('DELETAR este artigo publicado permanentemente? Esta ação é irreversível.')) return;
    const toastId = toast.loading("Deletando artigo publicado...");
    try {
      await supabase.from('articles').delete().eq('id', articleId);
      toast.success('Artigo publicado deletado.', { id: toastId });
      await loadPublished();
    } catch (error: any) {
      toast.error('Erro ao deletar', { id: toastId, description: error.message });
    }
  };

  const deleteAllPublished = async () => {
    const confirmText = prompt('⚠️ ATENÇÃO: Esta ação vai DELETAR TODAS as notícias publicadas!\n\nDigite "DELETAR TUDO" para confirmar:');
    if (confirmText !== 'DELETAR TUDO') {
      toast.info('Operação cancelada.');
      return;
    }
    setIsDeleting(true);
    const toastId = toast.loading("Deletando todas as notícias...");
    try {
      // Usando o cliente normal, mas confiando que o RLS está desativado para admins
      await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      toast.success('Todas as notícias foram deletadas!', { id: toastId });
      await loadPublished();
    } catch (error: any) {
      toast.error('Erro ao deletar', { id: toastId, description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (articleToSave: any) => {
    if (!articleToSave || !articleToSave.title || !articleToSave.body) {
      toast.error('Título e corpo do artigo são obrigatórios.');
      return;
    }
    setLocalLoading(true);
    const toastId = toast.loading("Salvando edição...");
    try {
      const { error } = await supabase
        .from('articles_queue')
        .update({
          title: articleToSave.title,
          summary: articleToSave.summary,
          body: articleToSave.body,
          meta_description: articleToSave.meta_description,
          tags: articleToSave.tags,
          image_url: articleToSave.image_url,
          video_url: articleToSave.video_url,
          is_featured: articleToSave.is_featured,
          image_focal_point: articleToSave.image_focal_point,
          image_focal_point_mobile: articleToSave.image_focal_point_mobile,
        })
        .eq('id', articleToSave.id);
      if (error) throw error;
      toast.success('Edição salva na fila!', { id: toastId });
      setShowEditModal(false);
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao salvar edição', { id: toastId, description: error.message });
    } finally {
      setLocalLoading(false);
    }
  };

  const isGlobalLoading = isScraping || isProcessing || isDeleting || localLoading || isRetrying;

  if (isLoading || !isAdmin) {
    return null; 
  }

  const pendingApproval = queue.filter(a => a.status === 'processed');
  const pendingProcessing = queue.filter(a => (a.status === 'pending_approval' || a.status === 'pending' || a.status === null || a.status === '') && a.body === null);
  const autoApproved = queue.filter(a => a.status === 'auto_approved');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <AdminActions 
        isLoading={isGlobalLoading} 
        onScrape={scrape} 
        onProcess={processOneWithAI} 
        onDeleteAll={deleteAllPublished} 
        onRetryRateLimited={handleRetryRateLimited}
        readyToRetryCount={rateLimitStats.ready_to_retry}
        onGenerateAutoAgenda={handleAutoAgenda}
      />
      <AdminStats 
        pendingProcessingCount={pendingProcessing.length}
        autoApprovedCount={autoApproved.length}
        pendingApprovalCount={pendingApproval.length}
        publishedCount={published.length}
        rateLimitedCount={rateLimitStats.total}
      />
      <PendingApprovalSection 
        articles={pendingApproval}
        uploadingImage={uploadingImage}
        onImageUpload={handleImageUpload}
        onFocalPointChange={handleFocalPointChange}
        onFocalPointCommit={handleFocalPointCommit}
        onToggleFeatured={handleToggleFeatured}
        onEdit={(article) => { setEditingArticle(article); setShowEditModal(true); }}
        onApprove={approveArticle}
        onReject={rejectArticle}
        onDelete={deleteFromQueue}
      />
      <AutoApprovedSection 
        articles={autoApproved}
        onProcess={processOneWithAI}
        onDelete={deleteFromQueue}
      />
      <PendingProcessingSection articles={pendingProcessing} onDelete={deleteFromQueue} />
      <PublishedArticlesSection articles={published} onDelete={deletePublishedArticle} />
      
      <EditArticleModal
        article={editingArticle}
        isOpen={showEditModal}
        isLoading={isGlobalLoading}
        uploadingImage={uploadingImage}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        onApprove={approveArticle}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}