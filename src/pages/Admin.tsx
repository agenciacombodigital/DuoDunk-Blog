import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, RefreshCw, Bot } from 'lucide-react';
import { logout } from '@/lib/auth';

export default function AdminPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data, error } = await supabase
        .from('articles_queue')
        .select('*')
        .eq('status', 'processed')
        .order('processed_at', { ascending: false });
  
      if (error) throw error;
      
      setQueue(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar artigos processados.", {
        description: error.message,
      });
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleImageUpload = async (articleId: string, file: File) => {
    setUploadingImage(articleId);
    const toastId = toast.loading("Fazendo upload da imagem...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${articleId}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Não foi possível obter a URL da imagem.");

      const { error: updateError } = await supabase
        .from('articles_queue')
        .update({ image_url: publicUrl })
        .eq('id', articleId);

      if (updateError) throw updateError;

      setQueue(currentQueue =>
        currentQueue.map(article =>
          article.id === articleId ? { ...article, image_url: publicUrl } : article
        )
      );

      toast.success("Imagem atualizada com sucesso!", { id: toastId });
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message, { id: toastId });
    } finally {
      setUploadingImage(null);
    }
  };

  async function scrape() {
    setIsScraping(true);
    toast.loading("Coletando notícias...");
    const { data, error } = await supabase.functions.invoke('scrape-news');
    toast.dismiss();

    if (error) {
      toast.error("Erro ao coletar: " + error.message);
    } else {
      toast.success(data.message || "Coleta finalizada!");
    }
    setIsScraping(false);
  }

  async function processOneWithAI() {
    setIsProcessing(true);
    toast.loading("Processando com IA...");
    const { data, error } = await supabase.functions.invoke('process-with-ai');
    toast.dismiss();

    if (error) {
      toast.error("Erro ao processar: " + error.message);
    } else {
      toast.success(data.message || "Processamento finalizado!");
      loadQueue();
    }
    setIsProcessing(false);
  }

  const approveArticle = async (id: string) => {
    if (!window.confirm('Deseja aprovar e publicar este artigo?')) {
      return;
    }
  
    try {
      const { data: article, error: fetchError } = await supabase
        .from('articles_queue')
        .select('*')
        .eq('id', id)
        .single();
  
      if (fetchError) throw fetchError;
  
      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          queue_id: article.id,
          source: article.source,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          body: article.body,
          image_url: article.image_url,
          original_link: article.original_link,
          tags: article.tags,
          meta_description: article.meta_description,
          published: true,
          featured: false,
          views: 0,
          published_at: new Date().toISOString(),
        });
  
      if (insertError) {
        throw new Error('Erro ao publicar: ' + insertError.message);
      }
  
      await supabase
        .from('articles_queue')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', id);
  
      toast.success('✅ Artigo aprovado e publicado!');
      loadQueue();
    } catch (error: any) {
      toast.error('❌ Erro: ' + error.message);
    }
  };

  const rejectArticle = async (id: string) => {
    const motivo = window.prompt('Motivo da rejeição (opcional):');
    if (motivo === null) return;
  
    try {
      await supabase
        .from('articles_queue')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', id);
  
      toast.info('Artigo rejeitado');
      loadQueue();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Você foi desconectado.');
    navigate('/admin/login');
  };

  const isLoading = isScraping || isProcessing;

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎯 Admin - DuoDunk</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            🚪 Sair
          </button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex gap-4 mb-8">
          <button
            onClick={scrape}
            disabled={isLoading}
            className="btn-cyan flex items-center justify-center"
          >
            {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Coletar Notícias
          </button>
          <button
            onClick={processOneWithAI}
            disabled={isLoading}
            className="btn-magenta flex items-center justify-center"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            🤖 Processar com IA
          </button>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">
            Artigos Processados pela IA ({queue.length})
          </h2>

          {loadingQueue ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-400">Carregando artigos...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-12 text-center">
              <p className="text-gray-300 text-lg mb-2">
                Nenhum artigo processado aguardando aprovação
              </p>
              <p className="text-sm text-gray-500">
                Clique em "Processar com IA" para processar artigos
              </p>
            </div>
          ) : (
            queue.map((article: any) => (
              <div key={article.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                
                <div className="p-6">
                  <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <label className="block text-sm text-gray-400 mb-2">
                      📸 Alterar imagem do artigo:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(article.id, file);
                      }}
                      disabled={uploadingImage === article.id}
                      className="block w-full text-sm text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-cyan-600 file:text-white
                        hover:file:bg-cyan-700
                        file:cursor-pointer cursor-pointer"
                    />
                    {uploadingImage === article.id && (
                      <p className="text-xs text-cyan-400 mt-2 animate-pulse">Fazendo upload...</p>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {article.summary}
                  </p>
                  
                  <details className="mb-4">
                    <summary className="cursor-pointer text-secondary hover:text-cyan-300 text-sm font-semibold">
                      📄 Ver conteúdo completo
                    </summary>
                    <div 
                      className="mt-4 prose prose-invert prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96"
                      dangerouslySetInnerHTML={{ __html: article.body }}
                    />
                  </details>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => approveArticle(article.id)}
                      className="btn-success flex-1 flex items-center justify-center"
                    >
                      ✅ Aprovar
                    </button>
                    
                    <button
                      onClick={() => rejectArticle(article.id)}
                      className="btn-danger flex items-center justify-center"
                    >
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}