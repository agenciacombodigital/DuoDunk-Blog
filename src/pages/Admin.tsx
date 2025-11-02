import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logout, isAuthenticated } from '@/lib/auth';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminActions from '@/components/admin/AdminActions';
import AdminStats from '@/components/admin/AdminStats';
import PendingApprovalSection from '@/components/admin/PendingApprovalSection';
import PendingProcessingSection from '@/components/admin/PendingProcessingSection';
import PublishedArticlesSection from '@/components/admin/PublishedArticlesSection';
import EditArticleModal from '@/components/admin/EditArticleModal';

export default function AdminPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [published, setPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
    } else {
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadQueue();
      await loadPublished();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
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

  const handleLogout = () => {
    logout();
    toast.info("Você foi desconectado.");
    navigate('/admin/login');
  };

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

  const handleFocalPointCommit = async (articleId: string, value: number[]) => {
    const focalPoint = `${value[0]}%`;
    const { error } = await supabase
      .from('articles_queue')
      .update({ image_focal_point: focalPoint })
      .eq('id', articleId);

    if (error) {
      toast.error('Erro ao salvar o foco da imagem.');
      loadQueue();
    }
  };
  
  const handleFocalPointChange = (articleId: string, value: number[]) => {
    setQueue(prevQueue =>
      prevQueue.map(a =>
        a.id === articleId ? { ...a, image_focal_point: `${value[0]}%` } : a
      )
    );
  };

  const approveArticle = async (article: any) => {
    if (!window.confirm('Aprovar e publicar este artigo?')) return;
    const toastId = toast.loading("Publicando artigo...");
    try {
      await supabase.from('articles').insert({
        queue_id: article.id,
        title: article.title,
        summary: article.summary,
        body: article.body,
        meta_description: article.meta_description,
        tags: article.tags,
        slug: article.slug,
        image_url: article.image_url,
        source: article.source,
        original_link: article.original_link,
        published: true,
        published_at: new Date().toISOString(),
        is_featured: article.is_featured || false,
        video_url: article.video_url || null,
        image_focal_point: article.image_focal_point || '50%',
      });
      await supabase.from('articles_queue').update({ status: 'approved' }).eq('id', article.id);
      toast.success('Artigo publicado!', { id: toastId });
      await loadData();
      setShowEditModal(false);
    } catch (error: any) {
      toast.error('Erro ao publicar', { id: toastId, description: error.message });
    }
  };

  const handleToggleFeatured = async (articleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('articles_queue')
        .update({ is_featured: !currentStatus })
        .eq('id', articleId);
  
      if (error) throw error;
  
      toast.success(
        !currentStatus ? '⭐ Marcado como destaque!' : '✓ Destaque removido'
      );
      
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao atualizar destaque', { 
        description: error.message,
      });
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

    setLoading(true);
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
        })
        .eq('id', articleToSave.id);

      if (error) throw error;

      toast.success('Edição salva na fila!', { id: toastId });
      setShowEditModal(false);
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao salvar edição', { id: toastId, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const isLoading = isScraping || isProcessing || isDeleting || loading;

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const pendingApproval = queue.filter(a => a.status === 'processed');
  const pendingProcessing = queue.filter(a => (a.status === 'pending_approval' || a.status === 'pending' || a.status === null || a.status === '') && a.body === null);
  const autoApproved = queue.filter(a => a.status === 'auto_approved');

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <AdminActions isLoading={isLoading} onScrape={scrape} onProcess={processOneWithAI} onDeleteAll={deleteAllPublished} />
        <AdminStats 
          pendingProcessingCount={pendingProcessing.length}
          autoApprovedCount={autoApproved.length}
          pendingApprovalCount={pendingApproval.length}
          publishedCount={published.length}
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
        <PendingProcessingSection articles={pendingProcessing} onDelete={deleteFromQueue} />
        <PublishedArticlesSection articles={published} onDelete={deletePublishedArticle} />
      </div>
      
      <EditArticleModal
        article={editingArticle}
        isOpen={showEditModal}
        isLoading={isLoading}
        uploadingImage={uploadingImage}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        onApprove={approveArticle}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}