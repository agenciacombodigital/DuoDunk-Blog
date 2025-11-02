import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logout, isAuthenticated } from '@/lib/auth';
import { toast } from "sonner";
import { RefreshCw, Bot, Loader2, Trash2, AlertTriangle, CheckCircle, Edit, Edit3, Calendar, Star, X, Save, Upload } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getObjectPositionStyle } from '@/lib/utils';

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

  const handleFocalPointCommit = async (articleId: string, focalPoint: string) => {
    const { error } = await supabase
      .from('articles_queue')
      .update({ image_focal_point: focalPoint })
      .eq('id', articleId);

    if (error) {
      toast.error('Erro ao salvar o foco da imagem.');
      loadQueue(); // Recarrega para reverter a alteração visual em caso de erro
    }
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
      
      loadData();
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

  const handleSaveEdit = async () => {
    if (!editingArticle || !editingArticle.title || !editingArticle.body) {
      toast.error('Título e corpo do artigo são obrigatórios.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Salvando edição...");

    try {
      const { error } = await supabase
        .from('articles_queue')
        .update({
          title: editingArticle.title,
          summary: editingArticle.summary,
          body: editingArticle.body,
          meta_description: editingArticle.meta_description,
          tags: editingArticle.tags,
          image_url: editingArticle.image_url,
          video_url: editingArticle.video_url,
          is_featured: editingArticle.is_featured,
          image_focal_point: editingArticle.image_focal_point,
        })
        .eq('id', editingArticle.id);

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

  const focalPointToPercentage = (focalPoint: string | null | undefined): number => {
    if (!focalPoint) return 50;
    if (focalPoint === 'top') return 0;
    if (focalPoint === 'center') return 50;
    if (focalPoint === 'bottom') return 100;
    if (focalPoint.endsWith('%')) return parseInt(focalPoint.replace('%', ''));
    return 50;
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
      <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 Admin - DuoDunk</h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">🚪 Sair</button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Bot className="w-6 h-6 text-cyan-400" />Ações</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <button onClick={scrape} disabled={isLoading} className="btn-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw className="w-5 h-5" /> Coletar Notícias</button>
            <button onClick={processOneWithAI} disabled={isLoading} className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Bot className="w-5 h-5" /> Processar com IA</button>
            <Link to="/admin/manual" className="btn-success flex items-center justify-center gap-2"><Edit3 className="w-5 h-5" /> Publicação Manual</Link>
            <Link to="/admin/rodada-nba" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"><Calendar className="w-5 h-5" /> Criar Rodada NBA</Link>
            <button onClick={deleteAllPublished} disabled={isLoading} className="btn-danger flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /> ⚠️ Deletar Publicados</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Aguardando Processamento</p><p className="text-3xl font-bold text-yellow-400">{pendingProcessing.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Auto-Aprovados (Shams)</p><p className="text-3xl font-bold text-green-400">{autoApproved.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Aguardando Aprovação</p><p className="text-3xl font-bold text-cyan-400">{pendingApproval.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Total Publicado</p><p className="text-3xl font-bold text-pink-400">{published.length}</p></div>
        </div>

        {pendingApproval.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-6 h-6 text-cyan-400" />Artigos Processados ({pendingApproval.length})</h2>
            <div className="space-y-6">
              {pendingApproval.map((article) => (
                <div key={article.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                  <div className="p-6">
                    <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <label className="block text-sm text-gray-400 mb-2 font-semibold">📸 Imagem do Artigo:</label>
                      {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" style={getObjectPositionStyle(article.image_focal_point)} />}
                      <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer" />
                      {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
                      <div className="mt-4">
                        <label className="text-xs font-semibold text-gray-400">Foco Vertical da Imagem</label>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-400">Topo</span>
                          <Slider
                            value={[focalPointToPercentage(article.image_focal_point)]}
                            onValueChange={(value) => {
                              setQueue(prevQueue =>
                                prevQueue.map(a =>
                                  a.id === article.id ? { ...a, image_focal_point: `${value[0]}%` } : a
                                )
                              );
                            }}
                            onValueCommit={(value) => handleFocalPointCommit(article.id, `${value[0]}%`)}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-gray-400">Baixo</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{article.summary}</p>
                    <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
                    {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">#{tag}</span>))}</div>}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleFeatured(article.id, article.is_featured)}
                        className={`flex-1 ${
                          article.is_featured 
                            ? 'bg-yellow-600 hover:bg-yellow-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        } text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition`}
                        title={article.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
                      >
                        <Star className={`w-5 h-5 ${article.is_featured ? 'fill-white' : ''}`} />
                        {article.is_featured ? 'Em Destaque' : 'Destacar'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingArticle(article);
                          setShowEditModal(true);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                        title="Editar antes de publicar"
                      >
                        <Edit className="w-5 h-5" />
                        Editar
                      </button>
                      
                      <button onClick={() => approveArticle(article)} className="btn-success flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />Aprovar</button>
                      <button onClick={() => rejectArticle(article.id)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 flex-1 flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Rejeitar</button>
                      <button onClick={() => deleteFromQueue(article.id)} className="btn-danger flex-1 flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Deletar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingProcessing.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-yellow-400" />Aguardando Processamento ({pendingProcessing.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingProcessing.slice(0, 6).map((article) => (
                <div key={article.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded-full font-semibold">{article.source}</span>
                    <h4 className="text-white font-semibold text-sm mt-2 line-clamp-2">{article.original_title}</h4>
                    <p className="text-gray-400 text-xs mt-1">{new Date(article.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
                    <button 
                      onClick={() => deleteFromQueue(article.id)} 
                      className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Deletar da fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {published.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-400" />Últimos Publicados ({published.length})</h2>
            <div className="space-y-2">
              {published.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-700/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <a href={`/artigos/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-white font-semibold text-sm hover:text-green-400 truncate block">{article.title}</a>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{article.source}</span>
                      <span className="text-xs text-gray-500">{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-cyan-400">{article.views || 0} views</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link to={`/admin/editar/${article.slug}`} className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"><Edit className="w-4 h-4" /></Link>
                    <button onClick={() => deletePublishedArticle(article.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showEditModal && editingArticle && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-2xl animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-blue-400" />
                Editar Artigo (Fila)
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Título</label>
                <input
                  type="text"
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Resumo</label>
                <textarea
                  value={editingArticle.summary}
                  onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Conteúdo (HTML)</label>
                <textarea
                  value={editingArticle.body}
                  onChange={(e) => setEditingArticle({ ...editingArticle, body: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Vídeo URL (Opcional)</label>
                <input
                  type="url"
                  value={editingArticle.video_url || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, video_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Link do YouTube, Twitter ou Instagram"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={Array.isArray(editingArticle.tags) ? editingArticle.tags.join(', ') : ''}
                  onChange={(e) => setEditingArticle({ 
                    ...editingArticle, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Imagem</label>
                {editingArticle.image_url && (
                  <div className="w-full h-48 rounded-lg mb-3 overflow-hidden bg-gray-700">
                    <img 
                      src={editingArticle.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      style={getObjectPositionStyle(editingArticle.image_focal_point)}
                    />
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    value={editingArticle.image_url || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, image_url: e.target.value })}
                    className="flex-1 w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Cole a URL ou faça upload"
                  />
                  <input
                    type="file"
                    id="modal-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(editingArticle.id, file);
                    }}
                    disabled={uploadingImage === editingArticle.id}
                  />
                  <label
                    htmlFor="modal-image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                  </label>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-300">Foco Vertical da Imagem</label>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-400">Topo</span>
                    <Slider
                      value={[focalPointToPercentage(editingArticle.image_focal_point)]}
                      onValueChange={(value) => {
                          setEditingArticle({ ...editingArticle, image_focal_point: `${value[0]}%` })
                      }}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-400">Baixo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Salvar Edição
              </button>
              <button
                onClick={() => approveArticle(editingArticle)}
                disabled={isLoading}
                className="btn-success flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Aprovar & Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}