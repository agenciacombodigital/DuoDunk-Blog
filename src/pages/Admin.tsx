import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logout, isAuthenticated } from '@/lib/auth';
import { toast } from "sonner";
import { RefreshCw, Bot, Loader2, Trash2, AlertTriangle, CheckCircle, Edit } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<any[]>([]);
  const [published, setPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
    } else {
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    console.log('Iniciando carregamento de dados...');
    
    try {
      await loadQueue();
      await loadPublished();
      console.log('Dados carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('articles_queue')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Artigos na fila:', data?.length || 0);
      console.log('Artigos por status:', data?.reduce((acc: { [key: string]: number }, a: { status: string }) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}));
      
      setQueue(data || []);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const loadPublished = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published_at, source, views')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(20);
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
      toast.success("Processamento finalizado!", { id: toastId, description: data.message });
      await loadData();
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

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('article-images').getPublicUrl(fileName);
      if (!data.publicUrl) throw new Error("URL da imagem não encontrada.");

      const { error: updateError } = await supabase
        .from('articles_queue')
        .update({ image_url: data.publicUrl })
        .eq('id', articleId);
      if (updateError) throw updateError;

      toast.success('Imagem atualizada!', { id: toastId });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro no upload', { id: toastId, description: error.message });
    } finally {
      setUploadingImage(null);
    }
  };

  const approveArticle = async (articleId: string) => {
    if (!window.confirm('Aprovar e publicar este artigo?')) return;

    const toastId = toast.loading("Publicando artigo...");
    try {
      const article = queue.find(a => a.id === articleId);
      if (!article) throw new Error("Artigo não encontrado na fila.");

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
      });

      await supabase.from('articles_queue').update({ status: 'approved' }).eq('id', articleId);

      toast.success('Artigo publicado!', { id: toastId });
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao publicar', { id: toastId, description: error.message });
    }
  };

  const rejectArticle = async (articleId: string) => {
    if (!window.confirm('Rejeitar este artigo permanentemente?')) return;

    const toastId = toast.loading("Rejeitando artigo...");
    try {
      await supabase.from('articles_queue').update({ status: 'rejected' }).eq('id', articleId);
      toast.info('Artigo rejeitado.', { id: toastId });
      await loadQueue();
    } catch (error: any) {
      toast.error('Erro ao rejeitar', { id: toastId, description: error.message });
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
      const { error } = await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast.success('Todas as notícias foram deletadas!', { id: toastId });
      await loadPublished();
    } catch (error: any) {
      toast.error('Erro ao deletar', { id: toastId, description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isScraping || isProcessing || isDeleting;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApproval = queue.filter(a => a.status === 'processed');
  const pendingProcessing = queue.filter(a => a.status === 'pending' || a.status === null || a.status === '');
  const autoApproved = queue.filter(a => a.status === 'auto_approved');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 Admin - DuoDunk</h1>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
            🚪 Sair
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Bot className="w-6 h-6 text-cyan-400" />Ações Automatizadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={scrape} disabled={isLoading} className="btn-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isScraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />} Coletar Notícias
            </button>
            <button onClick={processOneWithAI} disabled={isLoading} className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />} Processar com IA
            </button>
            <button onClick={deleteAllPublished} disabled={isLoading} className="btn-danger flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} ⚠️ Deletar Publicados
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Aguardando Processamento</p><p className="text-3xl font-bold text-yellow-400">{pendingProcessing.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Auto-Aprovados (Shams)</p><p className="text-3xl font-bold text-green-400">{autoApproved.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Aguardando Aprovação</p><p className="text-3xl font-bold text-cyan-400">{pendingApproval.length}</p></div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800"><p className="text-gray-400 text-sm mb-1">Publicados</p><p className="text-3xl font-bold text-pink-400">{published.length}</p></div>
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
                      {article.image_url && <img src={article.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />}
                      <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(article.id, file); }} disabled={uploadingImage === article.id} className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer" />
                      {uploadingImage === article.id && <p className="text-xs text-cyan-400 mt-2 animate-pulse flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />Fazendo upload...</p>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{article.summary}</p>
                    <details className="mb-4"><summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold">📄 Ver conteúdo completo</summary><div className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96" dangerouslySetInnerHTML={{ __html: article.body }} /></details>
                    {article.tags && <div className="flex flex-wrap gap-2 mb-4">{article.tags.map((tag: string) => (<span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">#{tag}</span>))}</div>}
                    <div className="flex gap-3">
                      <button onClick={() => approveArticle(article.id)} className="btn-success flex-1 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />Aprovar e Publicar</button>
                      <button onClick={() => rejectArticle(article.id)} className="btn-danger flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Rejeitar</button>
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
                <div key={article.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded-full font-semibold">{article.source}</span>
                  <h4 className="text-white font-semibold text-sm mt-2 line-clamp-2">{article.original_title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{new Date(article.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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
                  <div className="flex-1">
                    <a 
                      href={`/artigos/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-semibold text-sm hover:text-green-400"
                    >
                      {article.title}
                    </a>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{article.source}</span>
                      <span className="text-xs text-gray-500">{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-cyan-400">{article.views || 0} views</span>
                    </div>
                  </div>
                  <Link
                    to={`/admin/editar/${article.slug}`}
                    className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-semibold"
                  >
                    ✏️ Editar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}