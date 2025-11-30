import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata } from 'next';
import AmazonCTA from '@/components/AmazonCTA';

// Tipagem simplificada para o artigo
interface Article {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
  updated_at?: string;
  image_focal_point?: string;
  is_featured?: boolean;
  video_url?: string;
}

// ✅ Forçar renderização dinâmica (SSR) para sempre ter notícias frescas
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função auxiliar para tempo
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 1) return 'menos de 1h';
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays === 1 ? '1 dia' : `${diffInDays} dias`;
}

// Busca de dados no servidor
async function loadArticles(): Promise<Article[]> {
  try {
    const { data, error } = await supabaseServer
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao carregar artigos:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Erro fatal ao buscar artigos:', error);
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Duo Dunk - O Jogo Dentro do Jogo | Notícias sobre o mundo da NBA',
  description: 'DuoDunk é o seu portal de notícias quentes sobre NBA.',
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const articles = await loadArticles();

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-oswald">Carregando notícias...</h2>
        <p className="text-gray-500">Se demorar, verifique a conexão com o Supabase.</p>
      </div>
    );
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  const section1 = otherArticles.slice(0, 6);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {featuredArticle && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Destaque Principal */}
            <div className="lg:col-span-8">
              <Link href={`/artigos/${featuredArticle.slug}`} className="group block relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={getOptimizedImageUrl(featuredArticle.image_url, 800)}
                  alt={featuredArticle.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={getObjectPositionStyle(featuredArticle.image_focal_point, false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-6 w-full">
                  <span className="bg-pink-600 text-white px-2 py-1 text-xs font-bold uppercase rounded mb-2 inline-block">Destaque</span>
                  <h1 className="text-3xl md:text-5xl font-oswald font-bold text-white leading-tight mb-2 group-hover:text-pink-400 transition-colors">
                    {featuredArticle.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Clock size={14} />
                    Há {getTimeAgo(featuredArticle.published_at)}
                  </div>
                </div>
              </Link>
            </div>

            {/* Lateral */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {section1.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-3 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition">
                  <img 
                    src={getOptimizedImageUrl(article.image_url, 200)} 
                    className="w-24 h-24 object-cover rounded-lg"
                    alt=""
                  />
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-oswald text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 leading-snug">
                      {article.title}
                    </h3>
                    <span className="text-xs text-gray-500 mt-1">Há {getTimeAgo(article.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Banner Amazon */}
          <div className="mt-8">
             <AmazonCTA />
          </div>
        </section>
      )}
    </div>
  );
}