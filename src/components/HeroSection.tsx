import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Eye } from 'lucide-react';

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
  const [sideArticles, setSideArticles] = useState<HeroArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeroArticles();
  }, []);

  const loadHeroArticles = async () => {
    try {
      const { data } = await supabase
        .from('articles')
        .select('id, title, subtitle, slug, image_url, source, published_at, views')
        .eq('published', true)
        .order('views', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        setFeaturedArticle(data[0]);
        setSideArticles(data.slice(1, 5));
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
      <section className="relative bg-black py-20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse flex items-center justify-center h-96">
            <div className="text-white text-xl">Carregando destaques...</div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredArticle) return null;

  return (
    <section className="relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-[#FA007D]/20 to-transparent blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-cyan-500/20 to-transparent blur-3xl"></div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FA007D] to-[#C9006A] rounded-full">
            <TrendingUp className="w-5 h-5 text-white animate-pulse" />
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Em Destaque
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[#FA007D] to-transparent"></div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Article - Grande */}
          <Link
            to={`/artigos/${featuredArticle.slug}`}
            className="lg:col-span-2 group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-[#FA007D]/50 transition-all duration-500 transform hover:scale-[1.02]"
          >
            {/* Imagem de Fundo */}
            <div className="relative h-[500px] lg:h-[600px]">
              <img
                src={featuredArticle.image_url}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

              {/* Badge "Mais Lida" */}
              <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FA007D] to-[#C9006A] rounded-full shadow-lg">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">
                  {featuredArticle.views || 0} views
                </span>
              </div>

              {/* Conteúdo */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                {/* Tempo */}
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mb-4">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(featuredArticle.published_at)}
                </div>

                {/* Título */}
                <h2 className="text-white font-black text-3xl lg:text-5xl leading-tight mb-4 group-hover:text-[#FA007D] transition-colors">
                  {featuredArticle.title}
                </h2>

                {/* Subtítulo */}
                {featuredArticle.subtitle && (
                  <p className="text-gray-300 text-lg lg:text-xl font-medium leading-relaxed mb-6 line-clamp-2">
                    {featuredArticle.subtitle}
                  </p>
                )}

                {/* CTA */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-full hover:bg-[#FA007D] transition-all group-hover:translate-x-2">
                  Ler matéria completa
                  <span className="text-xl">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Side Articles - Menores */}
          <div className="flex flex-col gap-6">
            {sideArticles.map((article, index) => (
              <Link
                key={article.id}
                to={`/artigos/${article.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-[#FA007D]/30 transition-all duration-300 transform hover:scale-105"
              >
                <div className="relative h-56">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                  {/* Número de Ranking */}
                  <div className="absolute top-4 left-4 w-10 h-10 bg-gradient-to-br from-[#FA007D] to-[#C9006A] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-lg">
                      {index + 2}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-2">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(article.published_at)}
                    </div>

                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-[#FA007D] transition-colors">
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
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#FA007D] to-[#C9006A] text-white font-bold text-lg rounded-full hover:from-[#FA007D]/90 hover:to-[#C9006A]/90 transition-all shadow-lg hover:shadow-[#FA007D]/50 hover:scale-105"
          >
            Ver Todas as Notícias
            <TrendingUp className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}