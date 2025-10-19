import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';

interface SidebarArticle {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  source: string;
  published_at: string;
  views: number;
}

export default function NewsSidebar() {
  const [articles, setArticles] = useState<SidebarArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSidebarNews();
  }, []);

  const loadSidebarNews = async () => {
    try {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug, image_url, source, published_at, views')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(10);
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar sidebar:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-32 border border-gray-100">
        <div className="space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="bg-gray-200 h-20 w-20 rounded-xl flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="bg-gray-200 h-3 rounded w-full"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-32 border border-gray-100">
      {/* Header Moderno */}
      <div className="relative bg-gradient-to-r from-[#FA007D] via-[#C9006A] to-[#FA007D] px-6 py-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-white animate-pulse" />
          <h3 className="text-white font-bold text-lg uppercase tracking-wider">
            Em Alta
          </h3>
        </div>
      </div>

      {/* Lista de artigos com imagens */}
      <div className="divide-y divide-gray-100">
        {articles.map((article, index) => (
          <Link
            key={article.id}
            to={`/artigos/${article.slug}`}
            className="flex gap-4 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-300 group relative"
          >
            {/* Número de ranking */}
            <div className="absolute left-2 top-2 w-6 h-6 bg-gradient-to-br from-[#FA007D] to-[#C9006A] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg z-10">
              {index + 1}
            </div>

            {/* Imagem */}
            <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-lg">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="text-gray-900 font-bold text-sm line-clamp-2 leading-tight group-hover:text-[#FA007D] transition-colors mb-2">
                {article.title}
              </h4>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(article.published_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <Link
        to="/ultimas"
        className="block bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#FA007D]/10 hover:to-[#FA007D]/5 transition-all text-center py-4 border-t border-gray-200"
      >
        <span className="text-[#FA007D] font-bold text-sm uppercase tracking-wider hover:tracking-widest transition-all">
          Ver Todas as Notícias →
        </span>
      </Link>
    </div>
  );
}