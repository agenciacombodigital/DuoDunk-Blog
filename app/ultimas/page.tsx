"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ArticleCard from '@/components/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown } from 'lucide-react';
import { Metadata } from 'next';

const ARTICLES_PER_PAGE = 20;

// Metadata estática
export const metadata: Metadata = {
  title: 'Últimas Notícias da NBA - Arquivo Completo',
  description: 'Acompanhe o arquivo completo de notícias da NBA, incluindo resultados, análises e rumores de mercado.',
  alternates: {
    canonical: 'https://www.duodunk.com.br/ultimas',
  },
};

export default function Ultimas() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchArticles = async (pageNumber: number) => {
    const offset = pageNumber * ARTICLES_PER_PAGE;
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + ARTICLES_PER_PAGE - 1); // range é inclusivo

    if (error) {
      console.error('Erro ao buscar artigos:', error);
      return [];
    }
    
    // Verifica se há mais artigos para carregar
    if (data && data.length < ARTICLES_PER_PAGE) {
      setHasMore(false);
    }

    return data || [];
  };

  const loadInitialArticles = async () => {
    setLoading(true);
    const initialArticles = await fetchArticles(0);
    setArticles(initialArticles);
    setPage(1); // Próxima página a ser carregada
    setLoading(false);
  };

  const loadMoreArticles = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const newArticles = await fetchArticles(page);
    
    setArticles(prev => [...prev, ...newArticles]);
    setPage(prev => prev + 1);
    setIsFetchingMore(false);
  };

  useEffect(() => {
    loadInitialArticles();
  }, []);

  return (
    <div className="content-area container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Últimas Notícias</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: ARTICLES_PER_PAGE }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>

          <div className="mt-12 text-center">
            {hasMore && (
              <Button
                onClick={loadMoreArticles}
                disabled={isFetchingMore}
                className="btn-magenta px-8 py-6 text-lg"
              >
                {isFetchingMore ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="w-5 h-5 mr-2" />
                )}
                {isFetchingMore ? 'Carregando...' : 'Mais Notícias NBA'}
              </Button>
            )}
            {!hasMore && articles.length > 0 && (
              <p className="text-gray-500 font-semibold">
                Você chegou ao final do arquivo de notícias.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}