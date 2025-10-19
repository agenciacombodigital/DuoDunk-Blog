import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeroArticle {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image_url: string;
  source: string;
  published_at: string;
  views: number;
}

export default function HeroSection() {
  const [featuredArticle, setFeaturedArticle] = useState<HeroArticle | null>(null);
  const [miniGridArticles, setMiniGridArticles] = useState<HeroArticle[]>([]);
  const [sideArticles, setSideArticles] = useState<HeroArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeroArticles();
  }, []);

  const loadHeroArticles = async () => {
    try {
      // Fetch enough articles: 1 main + 3 mini-grid + 4 sidebar = 8
      const { data } = await supabase
        .from('articles')
        .select('id, title, subtitle, slug, image_url, source, published_at, views')
        .eq('published', true)
        .order('views', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(8);

      if (data && data.length > 0) {
        setFeaturedArticle(data[0]);
        setMiniGridArticles(data.slice(1, 4));
        setSideArticles(data.slice(4, 8));
      }
    } catch (error) {
      console.error('Erro ao carregar artigos em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const days = Math.floor(diffInHours / 24);
    return `Há ${days}d`;
  };

  if (loading) {
    return (
      <section className="relative bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse flex items-center justify-center h-96">
            <div className="text-gray-500 text-xl">Carregando destaques...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredArticle) return null;

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FA007D] to-[#C9006A] rounded-full">
            <TrendingUp className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Em Destaque
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Destaque + Mini Grid */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Article - Grande */}
            <Link
              to={`/artigos/${featuredArticle.slug}`}
              className="group block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <img
                  src={featuredArticle.image_url}
                  alt={featuredArticle.title}
                  className="w-full h-[500px] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="pt-6">
                <div className="flex items-center gap-2 text-cyan-600 text-sm font-semibold mb-3">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(featuredArticle.published_at)}
                </div>
                <h2 className="text-gray-900 font-bold text-3xl lg:text-4xl leading-tight mb-3 group-hover:text-[#FA007D] transition-colors">
                  {featuredArticle.title}
                </h2>
                {featuredArticle.subtitle && (
                  <p className="text-gray-600 text-lg leading-relaxed line-clamp-2">
                    {featuredArticle.subtitle}
                  </p>
                )}
              </div>
            </Link>

            {/* Mini Grid de 3 notícias */}
            {miniGridArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {miniGridArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/artigos/${article.slug}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all h-full flex flex-col">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-bold text-sm line-clamp-2 group-hover:text-pink-600 transition-colors flex-grow">
                          {article.title}
                        </h3>
                        <span className="text-xs text-gray-500 mt-2 block">
                          {formatDistanceToNow(new Date(article.published_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Side Articles - Menores */}
          <div className="flex flex-col gap-6">
            {sideArticles.map((article, index) => (
              <Link
                key={article.id}
                to={`/artigos/${article.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative h-48">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                  <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-[#FA007D] to-[#C9006A] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base">
                      {index + 2}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-base leading-tight line-clamp-2 group-hover:text-[#FA007D] transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Bottom */}
        <div className="text-center mt-12">
          <Link
            to="/ultimas"
            className="btn-magenta"
          >
            Ver Todas as Notícias
          </Link>
        </div>
      </div>
    </section>
  );
}