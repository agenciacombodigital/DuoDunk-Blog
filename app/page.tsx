import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback'; 
import { TrendingUp, Clock, Zap, BarChart2, BookOpen, ArrowRight, Eye } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import AmazonCTA from '@/components/AmazonCTA';
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
  is_featured?: boolean;
  author?: string;
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
  const { data } = await supabaseServer
    .from('articles')
    .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, image_focal_point, is_featured, author')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(50);
  return data || [];
}

export default async function Home() {
  const articles = await loadArticles();
  if (articles.length === 0) return null;

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  const sidebarArticles = otherArticles.slice(0, 3);
  const bottomHeroArticles = otherArticles.slice(3, 7);
  const mustRead = otherArticles.slice(7, 10);
  const archive = otherArticles.slice(10);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 font-inter">
      <section className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Link href={`/artigos/${featuredArticle.slug}`} className="group block relative w-full aspect-[3/4] lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-xl bg-gray-100">
              <ImageWithFallback
                src={featuredArticle.image_url}
                alt={featuredArticle.title}
                fill
                priority={true}
                sizes="100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                style={getObjectPositionStyle(featuredArticle.image_focal_point, false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-10 w-full z-10">
                <span className="bg-[#FA007D] text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 inline-block">Destaque</span>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white leading-tight mb-2 group-hover:text-[#00DBFB] transition-colors uppercase">
                  {featuredArticle.title}
                </h1>
                <div className="flex items-center gap-3 text-gray-300 text-xs font-inter tracking-widest mt-2 uppercase">
                  <span className="flex items-center gap-1"><Clock size={12}/> {getTimeAgo(featuredArticle.published_at)}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
              <TrendingUp className="text-[#FA007D]" size={20} />
              <h2 className="font-bebas text-2xl text-gray-900">Últimas Notícias da NBA</h2>
            </div>
            <div className="flex flex-col justify-between gap-3 flex-1">
              {sidebarArticles.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-3 items-stretch flex-1">
                  <div className="relative w-40 shrink-0 rounded-lg overflow-hidden aspect-video bg-gray-100">
                     <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        sizes="160px"
                     />
                  </div>
                  <div className="flex-1 flex flex-col justify-center border-b border-gray-100 group-last:border-0 pb-2">
                    <h3 className="font-oswald text-base lg:text-lg font-bold text-gray-900 leading-snug group-hover:text-[#FA007D] line-clamp-3 uppercase">
                      {article.title}
                    </h3>
                    <span className="text-[10px] text-gray-500 mt-1 font-inter">{getTimeAgo(article.published_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
             {bottomHeroArticles.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
                   <div className="aspect-video overflow-hidden relative bg-gray-100">
                      <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                   </div>
                   <div className="p-3">
                      <h3 className="font-oswald text-sm font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] line-clamp-2 uppercase">{article.title}</h3>
                   </div>
                </Link>             
             ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mb-12"><AmazonCTA /></div>

      {mustRead.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-8">
             <Zap className="text-yellow-500 w-6 h-6" />
             <h2 className="font-bebas text-4xl text-gray-900">Destaques e Jogos de Hoje</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {mustRead.map(article => (
               <Link key={article.id} href={`/artigos/${article.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                     <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={article.title}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="w-8 h-0.5 bg-[#FA007D]"></span>
                       <span className="text-xs font-bold uppercase text-gray-500">{article.tags?.[0]}</span>
                    </div>
                    <h3 className="font-oswald text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] transition-colors uppercase">
                      {article.title}
                    </h3>
                  </div>
               </Link>
             ))}
          </div>
        </section>
      )}

      {archive.length > 0 && (
        <section className="container mx-auto px-4 py-16">
           <div className="flex items-center gap-4 mb-10">
              <h2 className="font-bebas text-4xl text-black flex items-center gap-2">
                 <BookOpen className="text-gray-400"/> Arquivo
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
              {archive.map((article, idx) => {
                 const pattern = idx % 10;
                 const isWide = pattern === 0 || pattern === 7;
                 return (
                   <Link 
                     key={article.id} 
                     href={`/artigos/${article.slug}`} 
                     className={cn(
                       "group block relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-all",
                       isWide ? "sm:col-span-2 min-h-[280px]" : "min-h-[220px]"
                     )}
                   >
                      <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={article.title}
                        sizes={isWide ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 p-6 w-full">
                         <span className="text-[#00DBFB] text-[10px] font-bold uppercase tracking-widest mb-1 block">{article.tags?.[0]}</span>
                         <h3 className={cn("font-oswald font-bold text-white leading-tight group-hover:underline decoration-[#FA007D]", isWide ? "text-2xl md:text-3xl" : "text-lg", "uppercase")}>
                            {article.title}
                         </h3>
                      </div>
                   </Link>
                 )
              })}
           </div>
        </section>
      )}
    </div>
  );
}