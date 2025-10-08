import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Loader2, RefreshCw, Bot } from 'lucide-react';

export default function AdminPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function loadQueue() {
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
      console.error('Erro ao carregar a fila:', error);
    } finally {
      setLoadingQueue(false);
    }
  }

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

  async function approveArticle(id: string) {
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

      if (insertError) throw new Error('Erro ao publicar artigo: ' + insertError.message);

      await supabase
        .from('articles_queue')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      toast.success('✅ Artigo aprovado e publicado com sucesso!');
      loadQueue();
    } catch (error: any) {
      toast.error('❌ Erro ao aprovar o artigo.', {
        description: error.message,
      });
      console.error('Erro completo:', error);
    }
  }

  async function rejectArticle(id: string) {
    try {
      await supabase
        .from('articles_queue')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', id);

      toast.info('Artigo rejeitado.');
      loadQueue();
    } catch (error: any) {
      toast.error('Erro ao rejeitar o artigo.', {
        description: error.message,
      });
    }
  }

  const isLoading = isScraping || isProcessing;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 font-poppins">Painel de Admin</h1>
      
      <div className="flex gap-4 mb-8">
        <Button
          onClick={scrape}
          disabled={isLoading}
          className="bg-dunk-yellow text-black hover:bg-yellow-400 font-bold"
        >
          {isScraping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Coletar Notícias
        </Button>
        <Button
          onClick={processOneWithAI}
          disabled={isLoading}
          className="bg-dunk-pink text-white hover:bg-pink-600 font-bold"
        >
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          🤖 Processar com IA
        </Button>
      </div>

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Artigos Processados pela IA ({queue.length})
          </h2>
          {queue.length > 0 && (
            <p className="text-sm text-gray-400">
              Revise e aprove para publicar no site
            </p>
          )}
        </div>

        {loadingQueue ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-dunk-yellow mx-auto mb-4" />
            <p className="text-gray-400">Carregando artigos...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-dunk-card rounded-lg p-12 text-center">
            <p className="text-gray-300 text-lg mb-2">
              Nenhum artigo processado aguardando aprovação.
            </p>
            <p className="text-sm text-gray-500">
              Clique em "Processar com IA" para analisar os artigos coletados.
            </p>
          </div>
        ) : (
          queue.map((article) => (
            <div key={article.id} className="bg-dunk-card rounded-lg overflow-hidden">
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-64 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-semibold">
                    {article.source || 'Fonte Desconhecida'}
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full font-semibold">
                    ✨ Processado pela IA
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(article.processed_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  {article.title}
                </h3>
                
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {article.summary}
                </p>
                
                <details className="mb-4">
                  <summary className="cursor-pointer text-dunk-yellow hover:text-yellow-400 text-sm font-semibold">
                    📄 Ver conteúdo completo
                  </summary>
                  <div 
                    className="mt-4 prose prose-invert prose-sm max-w-none bg-dunk-dark p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: article.body }}
                  />
                </details>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags?.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="bg-dunk-dark p-3 rounded-lg mb-4">
                  <p className="text-xs text-gray-500 mb-1">Meta Description (SEO):</p>
                  <p className="text-sm text-gray-400">{article.meta_description}</p>
                </div>
                
                <div className="bg-dunk-dark p-3 rounded-lg mb-6">
                  <p className="text-xs text-gray-500 mb-1">URL do artigo:</p>
                  <p className="text-sm text-blue-400 font-mono">
                    /artigos/{article.slug}
                  </p>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => approveArticle(article.id)}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                  >
                    ✅ Aprovar e Publicar
                  </Button>
                  
                  <Button
                    onClick={() => rejectArticle(article.id)}
                    variant="destructive"
                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    ❌ Rejeitar
                  </Button>
                  
                  <a
                    href={article.original_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition text-center"
                  >
                    🔗 Original
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}