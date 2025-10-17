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
      // Hero section usa 8, este grid usa 6. Total 14.
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(14); 
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
    setLoading(false);
  };

  // Artigos para o grid 3x2, após os 8 do HeroSection
  const latestArticles = articles.length >= 8 ? articles.slice(8, 14) : [];

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skeleton loader */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border border-gray-200 rounded-lg">
                  <div className="h-40 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : latestArticles.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <p className="text-gray-500 text-lg mb-2">Nenhum artigo adicional para mostrar.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link
                  to="/ultimas"
                  className="btn-magenta"
                >
                  Ver Todas as Notícias
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}