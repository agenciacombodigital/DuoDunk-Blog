import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, RefreshCw, Bot } from 'lucide-react';

export default function AdminPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const isLoading = isScraping || isProcessing;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Painel de Admin</h1>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={scrape}
            disabled={isLoading}
            className="btn-cyan"
          >
            {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Coletar Notícias
          </button>
          <button
            onClick={processOneWithAI}
            disabled={isLoading}
            className="btn-magenta"
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
            <div className="card-premium p-12 text-center">
              <p className="text-gray-300 text-lg mb-2">
                Nenhum artigo processado aguardando aprovação
              </p>
              <p className="text-sm text-gray-500">
                Clique em "Processar com IA" para processar artigos
              </p>
            </div>
          ) : (
            queue.map((article: any) => (
              <div key={article.id} className="card-premium">
                {article.image_url && (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                
                <div className="p-6">
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
                      className="mt-4 prose prose-sm max-w-none bg-black p-4 rounded-lg overflow-auto max-h-96"
                      dangerouslySetInnerHTML={{ __html: article.body }}
                    />
                  </details>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => approveArticle(article.id)}
                      className="btn-success flex-1"
                    >
                      ✅ Aprovar
                    </button>
                    
                    <button
                      onClick={() => rejectArticle(article.id)}
                      className="btn-danger"
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