import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback'; 
import { TrendingUp, Clock, Zap, BarChart2, BookOpen, ArrowRight, Eye, ChevronRight } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import AmazonCTA from '@/components/AmazonCTA';
import ArchiveSection from '@/components/home/ArchiveSection';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 60; 

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
  image_focal_point?: string;
  image_focal_point_mobile?: string;
  is_featured?: boolean;
  author?: string;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  if (diffInHours < 1) return 'Agora';
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays === 1 ? '1d' : `${diffInDays}d`;
}

async function loadArticles(): Promise<Article[]> {
  const { data } = await supabaseServer
    .from('articles')
    .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, image_focal_point, image_focal_point_mobile, is_featured, author')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(100); 
  return data || [];
}

export default async function Home() {
  const articles = await loadArticles();
  if (articles.length === 0) return null;

  // Distribuição dos Artigos
  const featured = articles.find(a => a.is_featured) || articles[0];
  const remaining = articles.filter(a => a.id !== featured.id);
  
  const heroSidebar = remaining.slice(0, 3);
  const heroBottom = remaining.slice(3, 7);
  const mustRead = remaining.slice(7, 10); 
  const analysesBig = remaining[10];
  const analysesSmall = remaining.slice(11, 13);
  const mostRead = remaining.slice(13, 17); 
  const moreNews = remaining.slice(17, 29); 
  const archive = remaining.slice(29);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 font-inter">
      
      {/* --- SEÇÃO 1: HERO (Destaque Principal + Lateral Alinhada) --- */}
      <section className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <Link href={`/artigos/${featured.slug}`} className="group block relative w-full aspect-[3/4] md:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
              <ImageWithFallback
                src={featured.image_url}
                alt={featured.title}
                fill
                priority={true}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                style={getObjectPositionStyle(featured.image_focal_point, false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-12 w-full z-10">
                <span className="bg-[#FA007D] text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase mb-4 inline-block">Destaque</span>
                <h1 className="text-2xl md:text-5xl font-oswald font-bold text-white leading-tight uppercase group-hover:text-[#00DBFB] transition-colors">
                  {featured.title}
                </h1>
                <div className="flex items-center gap-3 text-gray-400 text-[11px] font-bold uppercase mt-4 tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={12}/> {getTimeAgo(featured.published_at)}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 border-b-2 border-[#FA007D] pb-2 mb-6">
              <TrendingUp className="text-[#FA007D]" size={18} />
              <h2 className="font-bebas text-2xl text-gray-900 uppercase tracking-wide">Últimas Notícias</h2>
            </div>
            <div className="flex-1 flex flex-col justify-between gap-6">
              {heroSidebar.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-4 items-center flex-1 min-h-[100px]">
                  <div className="relative w-32 h-24 md:w-36 md:h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                     <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        style={getObjectPositionStyle(article.image_focal_point, false)}
                     />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-oswald text-sm md:text-base font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] line-clamp-3 uppercase transition-colors">
                      {article.title}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 block uppercase">{getTimeAgo(article.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
           {heroBottom.map((article) => (
              <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                 <div className="aspect-[16/10] overflow-hidden relative rounded-2xl bg-gray-100 shadow-sm mb-3">
                    <ImageWithFallback 
                      src={article.image_url} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={article.title}
                      style={getObjectPositionStyle(article.image_focal_point, false)}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{article.tags?.[0] || 'NBA'}</div>
                 </div>
                 <h3 className="font-oswald text-sm font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] line-clamp-2 uppercase transition-colors">{article.title}</h3>
              </Link>             
           ))}
        </div>
      </section>

      <div className="container mx-auto px-4 my-8"><AmazonCTA /></div>

      {/* --- SEÇÃO 2: DESTAQUES E JOGOS DE HOJE --- */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
           <Zap className="text-yellow-500 w-7 h-7 fill-yellow-500" />
           <h2 className="font-bebas text-4xl text-gray-900 uppercase tracking-wide">Destaques e Jogos de Hoje</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {mustRead.map(article => (
             <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden relative rounded-2xl bg-gray-100 shadow-lg mb-6 border border-gray-100">
                   <ImageWithFallback 
                      src={article.image_url} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={article.title}
                      style={getObjectPositionStyle(article.image_focal_point, false)}
                    />
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-0.5 bg-[#FA007D]"></span>
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{article.tags?.[0] || 'NBA'}</span>
                </div>
                <h3 className="font-oswald text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] transition-colors uppercase">
                  {article.title}
                </h3>
             </Link>
           ))}
        </div>
      </section>

      {/* --- SEÇÃO 3: ANÁLISES --- */}
      {analysesBig && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
             <div className="flex items-center gap-3">
                <BarChart2 className="text-purple-600 w-6 h-6" />
                <h2 className="font-bebas text-4xl text-gray-900 uppercase">Análises</h2>
             </div>
             <Link href="/ultimas?tag=Análise" className="text-[10px] font-bold uppercase text-gray-500 hover:text-[#FA007D] flex items-center gap-1 transition-colors">
                Ver Todas <ChevronRight size={12}/>
             </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-7">
                <Link href={`/artigos/${analysesBig.slug}`} className="group relative block w-full aspect-video rounded-3xl overflow-hidden shadow-xl bg-gray-100">
                   <ImageWithFallback 
                      src={analysesBig.image_url} 
                      fill 
                      alt={analysesBig.title} 
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      style={getObjectPositionStyle(analysesBig.image_focal_point, false)}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                   <div className="absolute bottom-0 p-8">
                      <span className="bg-purple-600 text-white px-2.5 py-1 rounded text-[9px] font-bold uppercase mb-3 inline-block">Análise</span>
                      <h3 className="font-oswald text-2xl md:text-4xl font-bold text-white group-hover:text-[#00DBFB] transition-colors uppercase leading-tight">
                        {analysesBig.title}
                      </h3>
                   </div>
                </Link>
             </div>
             <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
                {analysesSmall.map(article => (
                   <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-4 items-center">
                      <div className="w-32 h-20 shrink-0 rounded-2xl overflow-hidden relative shadow-md bg-gray-100">
                        <ImageWithFallback 
                          src={article.image_url} 
                          fill 
                          alt={article.title} 
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          style={getObjectPositionStyle(article.image_focal_point, false)}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Opinião</span>
                        <h4 className="font-oswald text-base font-bold text-gray-900 group-hover:text-[#FA007D] uppercase transition-colors leading-tight mt-1">{article.title}</h4>
                      </div>
                   </Link>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* --- SEÇÃO 4: MAIS LIDAS --- */}
      <section className="bg-gray-50 py-16 my-12 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="font-bebas text-4xl text-gray-900 uppercase text-center mb-12 tracking-wide">Onde Assistir e Mais Lidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {mostRead.map((article, idx) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200">
                   <div className="absolute top-4 left-4 z-20 bg-[#FA007D] text-white font-bebas text-xl w-8 h-8 flex items-center justify-center rounded-lg shadow-lg">
                      {String(idx + 1).padStart(2, '0')}
                   </div>
                   <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
                      <ImageWithFallback 
                         src={article.image_url} 
                         fill 
                         alt={article.title} 
                         className="object-cover group-hover:scale-110 transition-transform duration-500"
                         style={getObjectPositionStyle(article.image_focal_point, false)}
                      />
                   </div>
                   <div className="p-5">
                      <h3 className="font-oswald text-base font-bold text-gray-900 group-hover:text-[#FA007D] transition-colors uppercase leading-tight">{article.title}</h3>
                   </div>
                </Link>
             ))}
          </div>
        </div>
      </section>

      {/* --- SEÇÃO 5: MAIS NOTÍCIAS (Feed de Miniaturas) --- */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10 border-b-2 border-black pb-3">
           <Eye className="text-blue-500 w-6 h-6" />
           <h2 className="font-bebas text-4xl text-gray-900 uppercase tracking-wide">Mais Notícias</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mb-20">
          {moreNews.map(article => (
            <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-4 items-center">
              <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 bg-gray-100">
                <ImageWithFallback 
                  src={article.image_url} 
                  fill 
                  alt={article.title} 
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  style={getObjectPositionStyle(article.image_focal_point, false)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-oswald text-sm font-bold text-gray-900 group-hover:text-[#FA007D] transition-colors uppercase leading-tight line-clamp-3">{article.title}</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-2 block tracking-tight">{getTimeAgo(article.published_at)} atrás</span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* --- SEÇÃO 6: ARQUIVO COMPLETO (INTERCALADO) --- */}
        <div className="mt-20">
           <ArchiveSection articles={archive} />
        </div>

        <div className="mt-16 text-center border-t border-gray-100 pt-10">
          <Link href="/ultimas" className="btn-magenta inline-flex items-center gap-3 px-12 uppercase tracking-widest text-sm">
            Ver Todas as Matérias <ArrowRight size={18}/>
          </Link>
        </div>
      </section>
    </div>
  );
}