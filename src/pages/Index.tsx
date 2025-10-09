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
        .limit(7);
      setArticles(data || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <>
      <section className="hero-section text-center py-24 md:py-32">
        <div className="container mx-auto px-4">
          <Dribbble className="mx-auto text-secondary mb-6 glow-cyan" size={64} />
          <h1 className="text-6xl md:text-8xl font-heading tracking-wider mb-4">
            O Jogo Dentro do Jogo.
          </h1>
          <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto">
            Notícias, análises e tudo sobre o universo da NBA com o poder da IA.
          </p>
          <button className="btn-magenta mt-8">Explorar Notícias</button>
        </div>
      </section>

      <section className="content-area container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold mb-8">Últimas Notícias</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticle && (
              <Link to={`/artigos/${featuredArticle.slug}`} className="lg:col-span-2 group relative block rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02]">
                <img src={featuredArticle.image_url} alt={featuredArticle.title} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                <div className="relative p-8 flex flex-col justify-end h-[500px]">
                  <span className="bg-primary text-primary-foreground text-xs font-bold uppercase px-3 py-1 rounded mb-3 self-start glow-magenta">Destaque</span>
                  <h3 className="text-4xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-secondary">{featuredArticle.title}</h3>
                  <p className="text-gray-300 line-clamp-2">{featuredArticle.summary}</p>
                </div>
              </Link>
            )}
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