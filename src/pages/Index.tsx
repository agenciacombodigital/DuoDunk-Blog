import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ArticleCard from '@/components/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Dribbble } from 'lucide-react';
import { Link } from 'react-router-dom';

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
        .limit(7); // Pega 7 artigos (1 destaque + 6 no grid)
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <>
      {/* Hero Section (Dark) */}
      <section className="dark-section text-center py-24 md:py-32 overflow-hidden diagonal-cut">
        <div className="container mx-auto px-4 relative z-10 pb-12 md:pb-24">
          <Dribbble className="mx-auto text-secondary mb-6" size={64} />
          <h1 className="text-6xl md:text-8xl font-heading tracking-wider mb-4">
            O Jogo Dentro do Jogo.
          </h1>
          <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto">
            Notícias, análises e tudo sobre o universo da NBA com o poder da IA.
          </p>
          <button className="btn-primary mt-8">Explorar Notícias</button>
        </div>
      </section>

      {/* Últimas Notícias (Light) */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-heading tracking-wider mb-8 text-gray-900">Últimas Notícias</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 lg:col-span-8"><Skeleton className="h-[500px] w-full" /></div>
            <div className="md:col-span-5 lg:col-span-4 space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Artigo em Destaque */}
            {featuredArticle && (
              <Link to={`/artigos/${featuredArticle.slug}`} className="lg:col-span-2 group relative block rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
                <img src={featuredArticle.image_url} alt={featuredArticle.title} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                <div className="relative p-8 flex flex-col justify-end h-[500px]">
                  <span className="bg-primary text-primary-foreground text-xs font-bold uppercase px-3 py-1 rounded mb-3 self-start">Destaque</span>
                  <h3 className="text-4xl font-heading text-white mb-2 transition-colors duration-300 group-hover:text-secondary">{featuredArticle.title}</h3>
                  <p className="text-gray-300 line-clamp-2">{featuredArticle.summary}</p>
                </div>
              </Link>
            )}
            {/* Outros Artigos */}
            <div className="lg:col-span-1 space-y-6">
              {otherArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}