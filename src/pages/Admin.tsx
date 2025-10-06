import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Loader2, Check, RefreshCw, Bot, Link as LinkIcon } from 'lucide-react';

export default function AdminPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function loadQueue() {
    setLoadingQueue(true);
    const { data } = await supabase
      .from('articles_queue')
      .select('*')
      .eq('status', 'processed')
      .order('processed_at', { ascending: false });
    
    setQueue(data || []);
    setLoadingQueue(false);
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
    const article = queue.find((a: any) => a.id === id);
    if (!article) return;

    const articleToPublish = {
      title: article.title,
      summary: article.summary,
      body: article.body,
      image_url: article.image_url,
      slug: article.slug,
      tags: article.tags,
      meta_description: article.meta_description,
      published: true,
      published_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('articles').insert(articleToPublish);

    if (insertError) {
      toast.error("Erro ao publicar: " + insertError.message);
      return;
    }

    await supabase.from('articles_queue').update({ status: 'approved' }).eq('id', id);
    toast.success('Artigo publicado!');
    loadQueue();
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

      <div className="space-y-6">
        {loadingQueue && <p>Carregando fila de aprovação...</p>}
        {!loadingQueue && queue.length === 0 && <p>Nenhum artigo pronto para aprovação.</p>}
        {queue.map((article: any) => (
          <div key={article.id} className="bg-dunk-card p-6 rounded-lg flex flex-col md:flex-row gap-6">
            <img src={article.image_url} alt={article.title} className="w-full md:w-48 h-48 md:h-auto object-cover rounded" />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{article.title}</h3>
              <p className="text-gray-400 mb-4 text-sm">{article.summary}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => approveArticle(article.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="mr-2 h-4 w-4" /> Aprovar e Publicar
                </Button>
                <a
                  href={article.original_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-dunk-yellow hover:underline text-sm font-semibold"
                >
                  <LinkIcon className="mr-2 h-4 w-4" /> Ver Original
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}