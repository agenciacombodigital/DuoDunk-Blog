import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import { TrendingUp, Calendar, Clock, Star, Zap, BarChart2, BookOpen, Play } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata } from 'next';
import AmazonCTA from '@/components/AmazonCTA';

// Configurações de Servidor (SSR)
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
  author?: string; // Adicionado para evitar erro de tipagem no uso
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
    return <div className="min-h-screen flex items-center justify-center text-2xl font-oswald">Carregando notícias...</div>;
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  // Fatiamento para o Grid Denso
  const sidebarArticles = otherArticles.slice(0, 3); // 3 na lateral
  const bottomHeroArticles = otherArticles.slice(3, 7); // 4 abaixo do destaque
  const mustRead = otherArticles.slice(7, 10);
  const deepDive = otherArticles.slice(10, 12);
  const quickHits = otherArticles.slice(12, 16);
  const trending = otherArticles.slice(16, 20);
  const archive = otherArticles.slice(20);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20">
      
      {/* --- SEÇÃO 1: HERO COMPLEXO --- */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Destaque Gigante (Esquerda - 8 colunas) */}
          <div className="lg:col-span-8">
            <Link 
              href={`/artigos/${featuredArticle.slug}`} 
              className="group block relative w-full aspect-[4/3] lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={getOptimizedImageUrl(featuredArticle.image_url, 1200)}
                alt={featuredArticle.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={getObjectPositionStyle(featuredArticle.image_focal_point, false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-10 w-full z-10">
                <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-1">
                  <Star size={12} fill="currentColor"/> Destaque
                </span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-oswald font-bold text-white leading-tight mb-2 group-hover:text-pink-400 transition-colors drop-shadow-lg">
                  {featuredArticle.title}
                </h1>
                {/* Resumo removido conforme pedido */}
                <div className="flex items-center gap-3 text-gray-400 text-xs font-inter uppercase tracking-widest mt-4">
                  <span className="flex items-center gap-1"><Clock size={12} /> Há {getTimeAgo(featuredArticle.published_at)}</span>
                  <span>•</span>
                  <span>Por {featuredArticle.author || 'Redação'}</span>
                </div>
              </div>
            </Link>
          </div>

          {/* 2. Sidebar Lateral (Direita - 4 colunas - 3 Itens) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-2">
              <TrendingUp className="text-pink-600" size={24} />
              <h2 className="font-bebas text-3xl text-gray-900">Últimas</h2>
            </div>
            <div className="flex flex-col gap-4 h-full">
              {sidebarArticles.map((article, index) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-4 items-start h-full">
                  <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden">
                     <img 
                       src={getOptimizedImageUrl(article.image_url, 200)} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                       alt={article.title}
                       style={getObjectPositionStyle(article.image_focal_point, true)}
                     />
                  </div>
                  <div className="flex-1 pb-2 border-b border-gray-100 group-last:border-0">
                    <h3 className="font-oswald text-sm md:text-base font-bold text-gray-900 leading-snug group-hover:text-pink-600 transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                       <Clock size={10} /> Há {getTimeAgo(article.published_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* 3. Linha Inferior (4 Notícias lado a lado) */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
             {bottomHeroArticles.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-all">
                   <div className="aspect-video overflow-hidden relative">
                      <img 
                        src={getOptimizedImageUrl(article.image_url, 400)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                        {article.tags?.[0] || 'NBA'}
                      </div>
                   </div>
                   <div className="p-3">
                      <h3 className="font-oswald text-sm font-bold text-gray-900 leading-tight group-hover:text-pink-600 line-clamp-2">
                         {article.title}
                      </h3>
                   </div>
                </Link>
             ))}
          </div>

        </div>
      </section>

      {/* CTA AMAZON (Posicionado após o bloco principal) */}
      <div className="container mx-auto px-4 mb-12">
         <AmazonCTA />
      </div>

      {/* --- SEÇÃO 2: NÃO PERCA --- */}
      {mustRead.length > 0 && (
        <section className="bg-gray-50 py-12 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="font-bebas text-4xl text-gray-900 mb-8 flex items-center gap-2">
              <Zap className="text-yellow-500" /> Não Perca
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {mustRead.map(article => (
                 <Link key={article.id} href={`/artigos/${article.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="aspect-[16/9] overflow-hidden relative">
                       <img 
                         src={getOptimizedImageUrl(article.image_url, 600)} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                         alt={article.title}
                         style={getObjectPositionStyle(article.image_focal_point)}
                       />
                    </div>
                    <div className="p-5">
                       <h3 className="font-oswald text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 mb-2 leading-tight">{article.title}</h3>
                       <p className="font-inter text-sm text-gray-500 line-clamp-2">{article.summary}</p>
                    </div>
                 </Link>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* --- SEÇÃO 3: ANÁLISES (Big Cards) --- */}
      {deepDive.length > 0 && (
        <section className="container mx-auto px-4 py-12">
            <h2 className="font-bebas text-4xl text-gray-900 mb-8 flex items-center gap-2">
              <BarChart2 className="text-purple-600" /> Análises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {deepDive.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                  <div className="relative aspect-[2/1] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                    <img
                      src={getOptimizedImageUrl(article.image_url, 800)}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
                      style={getObjectPositionStyle(article.image_focal_point)}
                      alt={article.title}
                    />
                  </div>
                  {/* Título fora do overlay */}
                  <div className="pt-4">
                    <span className="text-pink-600 text-xs font-bold uppercase tracking-widest mb-1 block">Opinião</span>
                    <h3 className="font-oswald text-2xl md:text-3xl font-bold text-gray-900 leading-tight group-hover:text-pink-600 transition-colors">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
        </section>
      )}

      {/* --- SEÇÃO 4: MAIS LIDAS (Listão) --- */}
      {trending.length > 0 && (
        <section className="bg-zinc-900 text-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-bebas text-4xl mb-10 text-center">🔥 Em Alta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {trending.map((article, idx) => (
                 <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-6 items-center border-b border-zinc-800 pb-4 last:border-0">
                    <span className="text-5xl font-bebas text-zinc-700 group-hover:text-pink-600 transition-colors select-none w-12 text-center">0{idx+1}</span>
                    
                    {/* Imagem Adicionada */}
                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <img 
                        src={getOptimizedImageUrl(article.image_url, 150)} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        style={getObjectPositionStyle(article.image_focal_point, true)}
                      />
                    </div>
                    
                    <div>
                       <div className="text-xs font-bold text-zinc-500 uppercase mb-1">{article.tags?.[0]}</div>
                       <h3 className="font-oswald text-lg md:text-xl font-bold group-hover:text-zinc-300 transition-colors leading-tight">
                         {article.title}
                       </h3>
                    </div>
                 </Link>
               ))}
            </div>
          </div>
        </section>
      )}

      {/* --- SEÇÃO 5: DESTAQUES RÁPIDOS (Grid 4) --- */}
      {quickHits.length > 0 && (
        <section className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickHits.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 relative">
                    <img 
                      src={getOptimizedImageUrl(article.image_url, 400)} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      alt={article.title}
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <h3 className="font-oswald text-sm md:text-base font-bold text-gray-900 leading-snug group-hover:text-pink-600 transition-colors line-clamp-3">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
        </section>
      )}

      {/* --- SEÇÃO FINAL: ARQUIVO (Grid Infinito) --- */}
      {archive.length > 0 && (
        <section className="container mx-auto px-4 py-16 border-t border-gray-100">
           <div className="flex items-center gap-4 mb-8">
              <h2 className="font-bebas text-4xl text-black flex items-center gap-2">
                 <BookOpen className="text-gray-400"/> Mais Notícias
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {archive.map((article) => (
                 <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                    <div className="aspect-[3/2] rounded-xl overflow-hidden mb-4 bg-gray-100 shadow-sm group-hover:shadow-md transition-all relative">
                       <img 
                         src={getOptimizedImageUrl(article.image_url, 400)} 
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         alt={article.title}
                         style={getObjectPositionStyle(article.image_focal_point)}
                       />
                       <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold">
                          {getTimeAgo(article.published_at)}
                       </div>
                    </div>
                    <h3 className="font-oswald text-lg font-bold text-gray-900 leading-tight group-hover:text-pink-600 transition-colors line-clamp-2">
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