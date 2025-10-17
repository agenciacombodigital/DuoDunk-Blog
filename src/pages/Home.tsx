import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import HeroSection from '@/components/HeroSection';

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
        .limit(10);
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
    setLoading(false);
  };

  const mainArticle = articles.length > 0 ? articles[0] : null;
  const subFeatureArticles = articles.length > 1 ? articles.slice(1, 4) : [];

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
              {/* Main Article (Full Width) */}
              {mainArticle && (
                <div>
                  <Link to={`/artigos/${mainArticle.slug}`} className="group block">
                    <div className="relative overflow-hidden h-[28rem] rounded-xl shadow-lg">
                      <img
                        src={mainArticle.image_url}
                        alt={mainArticle.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

              {/* Sub-Feature Grid (3 columns) */}
              {subFeatureArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12 border-t border-gray-200">
                  {subFeatureArticles.map((article, index) => (
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