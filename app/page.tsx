import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import { TrendingUp, Calendar, Clock, Star, Play } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata } from 'next';
import AmazonCTA from '@/components/AmazonCTA';

// Força atualização constante (SSR Real)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function loadArticles(): Promise<Article[]> {
  try {
    // Busca 100 artigos para preencher a home
    const { data, error } = await supabaseServer
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Erro Fatal:', error);
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
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <h2 className="text-2xl font-oswald">Nenhuma notícia encontrada.</h2>
      </div>
    );
  }

  // Lógica de Distribuição
  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  // Fatiamento (Slices)
  const section1 = otherArticles.slice(0, 6);   // Lateral do Destaque
  const section2 = otherArticles.slice(6, 12);  // "Não Perca"
  // const section3 = otherArticles.slice(12, 16); // "Destaques Rápidos" - Removido para simplificar o layout
  const remaining = otherArticles.slice(12);    // Todo o resto (Arquivo)

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20">
      
      {/* SEÇÃO 1: HERO (Destaque + Lateral) */}
      {featuredArticle && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Destaque Principal */}
            <div className="lg:col-span-8">
              <Link href={`/artigos/${featuredArticle.slug}`} className="group block relative aspect-video rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
                <img
                  src={getOptimizedImageUrl(featuredArticle.image_url, 1200)}
                  alt={featuredArticle.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={getObjectPositionStyle(featuredArticle.image_focal_point, false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-6 md:p-8 w-full z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Star size={12} fill="currentColor"/> Destaque
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white leading-tight mb-3 group-hover:text-pink-400 transition-colors line-clamp-3">
                    {featuredArticle.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-300 text-sm font-inter">
                    <Clock size={14} />
                    Há {getTimeAgo(featuredArticle.published_at)}
                  </div>
                </div>
              </Link>
            </div>

            {/* Lista Lateral */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-pink-600" size={20} />
                <h2 className="font-bebas text-2xl text-gray-900">Últimas do dia</h2>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 max-h-[500px] lg:max-h-full">
                {section1.map((article) => (
                  <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-3 bg-gray-50 p-3 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all">
                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <img src={getOptimizedImageUrl(article.image_url, 200)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-oswald text-sm font-bold text-gray-900 line-clamp-3 group-hover:text-pink-600 leading-snug">
                        {article.title}
                      </h3>
                      <span className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                         <Clock size={10} /> {getTimeAgo(article.published_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      <div className="container mx-auto px-4">
        <AmazonCTA />
      </div>

      {/* SEÇÃO 2: NÃO PERCA (Horizontal Cards) */}
      {section2.length > 0 && (
        <section className="container mx-auto px-4 py-8">
            <h2 className="font-bebas text-3xl text-gray-900 mb-6 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
              📌 Não Perca
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {section2.map(article => (
                 <Link key={article.id} href={`/artigos/${article.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100">
                    <div className="aspect-[16/9] overflow-hidden">
                       <img src={getOptimizedImageUrl(article.image_url, 600)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/>
                    </div>
                    <div className="p-4">
                       <h3 className="font-oswald text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 mb-2">{article.title}</h3>
                       <p className="font-inter text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                    </div>
                 </Link>
               ))}
            </div>
        </section>
      )}

      {/* SEÇÃO 3: ARQUIVO (Restante das Notícias) */}
      {remaining.length > 0 && (
        <section className="container mx-auto px-4 py-8 mt-8 border-t border-gray-100 pt-12">
           <div className="flex items-center gap-4 mb-8">
              <h2 className="font-bebas text-4xl text-black">📚 Mais Notícias</h2>
              <div className="flex-1 h-px bg-gray-200"></div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {remaining.map((article) => (
                 <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-gray-100 relative">
                       <img src={getOptimizedImageUrl(article.image_url, 400)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt=""/>
                       <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-inter flex items-center gap-1"><Clock size={10}/> {getTimeAgo(article.published_at)}</span>
                       </div>
                    </div>
                    <h3 className="font-oswald text-sm md:text-base font-bold text-gray-900 leading-snug group-hover:text-pink-600 transition-colors line-clamp-3">
                       {article.title}
                    </h3>
                 </Link>
              ))}
           </div>
        </section>
      )}

    </div>
  );
}