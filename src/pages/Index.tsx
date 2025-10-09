import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ArticleCard from '@/components/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(12);
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center py-16 mb-12 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 font-poppins text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400">
          O Jogo Dentro do Jogo.
        </h1>
        <p className="text-center text-gray-400 mt-4 max-w-2xl mx-auto">
          Notícias, análises profundas e tudo sobre o universo da NBA, trazido até você com o poder da IA.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6 font-poppins">Últimas Notícias</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}