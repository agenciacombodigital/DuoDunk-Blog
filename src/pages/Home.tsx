import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import HeroSection from '@/components/HeroSection';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
        .limit(15); // Aumentado para popular o novo layout
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
    setLoading(false);
  };

  // Nova lógica para distribuir os artigos no layout
  const mainArticle = articles.length > 0 ? articles[0] : null;
  const miniGridArticles = articles.length > 1 ? articles.slice(1, 4) : [];
  const sidebarArticles = articles.length > 4 ? articles.slice(4, 8) : [];
  const secondaryArticles = articles.length > 8 ? articles.slice(8) : [];

  return (
    <>
      <HeroSection />

      {/* Últimas Notícias */}
      <section className="bg-white py-16">
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
              {/* Main Grid Reestruturado */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna Esquerda - Destaque + Mini Grid */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Notícia Principal */}
                  {mainArticle && (
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
                  )}

                  {/* NOVO: Mini Grid de 3 notícias */}
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

                {/* Coluna Direita - Sidebar */}
                <div className="space-y-4">
                  {sidebarArticles.map((article) => (
                    <Link key={article.id} to={`/artigos/${article.slug}`} className="flex items-center gap-4 group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <img 
                        src={article.image_url} 
                        alt={article.title} 
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0" 
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-[#FA007D] line-clamp-3 text-sm leading-tight">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(article.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
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