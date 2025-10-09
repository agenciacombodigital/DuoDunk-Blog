import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(10); // Ajustado para 10 artigos (1 principal, 4 manchetes, 5 secundários)
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
    setLoading(false);
  };

  const mainArticle = articles.length > 0 ? articles[0] : null;
  const headlineArticles = articles.length > 1 ? articles.slice(1, 5) : [];
  const secondaryArticles = articles.length > 5 ? articles.slice(5) : [];

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <svg className="w-64 h-64 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto fade-in">
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#FA007D]/20 to-[#00DBFB]/20 rounded-full border border-gray-700">
            <svg className="w-12 h-12 text-[#00DBFB]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            O JOGO DENTRO DO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FA007D] to-[#00DBFB]">
              JOGO.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Notícias, análises e tudo sobre o universo da NBA com o poder da IA.
          </p>
          <Link to="/ultimas" className="btn-magenta inline-flex items-center gap-2">
            Explorar Notícias
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Últimas Notícias */}
      <section className="content-area py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900">
              Últimas Notícias
            </h2>
            <Link 
              to="/ultimas" 
              className="text-[#FA007D] hover:text-[#00DBFB] transition-colors font-semibold inline-flex items-center gap-2"
            >
              Ver Todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FA007D] mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando artigos...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <p className="text-gray-500 text-lg mb-2">Nenhum artigo publicado ainda.</p>
              <p className="text-sm text-gray-400">Aprove artigos no painel admin para publicá-los aqui!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Article (Left) */}
                {mainArticle && (
                  <div className="lg:col-span-2">
                    <Link to={`/artigos/${mainArticle.slug}`} className="group block">
                      <div className="relative overflow-hidden h-[28rem] rounded-xl shadow-lg">
                        <img
                          src={mainArticle.image_url}
                          alt={mainArticle.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="pt-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-[#FA007D] transition-colors leading-tight">
                          {mainArticle.title}
                        </h2>
                        <p className="text-gray-600 text-lg mb-4 line-clamp-3">
                          {mainArticle.summary}
                        </p>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Headlines (Right) */}
                <div className="space-y-1">
                  {headlineArticles.map((article, index) => (
                    <Link key={article.id} to={`/artigos/${article.slug}`} className={`block p-4 rounded-lg hover:bg-gray-50 transition-colors ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                      <h3 className="font-semibold text-gray-800 group-hover:text-[#FA007D]">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(article.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Secondary Grid */}
              {secondaryArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12 border-t border-gray-200">
                  {secondaryArticles.map((article, index) => (
                    <ArticleCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}