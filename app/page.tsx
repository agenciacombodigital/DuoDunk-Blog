import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback'; 
import { TrendingUp, Clock, Zap, BarChart2, BookOpen, ArrowRight, Eye, ChevronRight } from 'lucide-react';
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
  created_at: string;
  image_focal_point?: string;
  image_focal_point_mobile?: string;
  is_featured?: boolean;
  author?: string;
}

// Configuração de Fuso Horário
const TIMEZONE = 'America/Sao_Paulo';

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
    .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, created_at, image_focal_point, image_focal_point_mobile, is_featured, author')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(100); 
  return data || [];
}

export default async function Home() {
  const articles = await loadArticles();
  if (articles.length === 0) return null;

  // Distribuição fixa para o Hero
  const featured = articles.find(a => a.is_featured) || articles[0];
  const remaining = articles.filter(a => a.id !== featured.id);
  const heroSidebar = remaining.slice(0, 3);
  const heroBottom = remaining.slice(3, 7);
  
  // Distribuição para as seções White Mode
  const otherArticles = remaining.slice(7);

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-inter">
      
      {/* --- SEÇÃO 1: HERO --- */}
      <section className="bg-white text-gray-900 pb-10">
        <div className="container mx-auto px-4 pt-6 md:pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* DESTAQUE PRINCIPAL */}
            <div className="lg:col-span-2">
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
                  <span className="bg-[#FA007D] text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase mb-4 inline-block tracking-widest">Destaque</span>
                  <h1 className="text-2xl md:text-5xl font-oswald font-bold text-white leading-tight uppercase group-hover:text-[#00DBFB] transition-colors">
                    {featured.title}
                  </h1>
                  <div className="flex items-center gap-3 text-gray-400 text-[11px] font-bold uppercase mt-4 tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12}/> {getTimeAgo(featured.published_at)}</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-1 flex flex-col h-full">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-1 mb-3">
                <TrendingUp className="text-[#FA007D]" size={16} />
                <h3 className="font-bebas text-xl text-gray-900 uppercase tracking-wide">Últimas Notícias</h3>
              </div>
              
              <div className="flex flex-col gap-3 flex-1">
                {heroSidebar.map((article) => (
                  <Link 
                    key={article.id} 
                    href={`/artigos/${article.slug}`} 
                    className="group flex gap-4 items-center bg-gray-50 p-2 rounded-2xl hover:bg-gray-100 transition border border-gray-100 shadow-sm flex-1"
                  >
                    <div className="relative w-24 h-24 md:w-36 md:h-36 shrink-0 rounded-xl overflow-hidden bg-gray-200 shadow-inner">
                      <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        style={getObjectPositionStyle(article.image_focal_point, false)}
                      />
                    </div>
                    <div className="flex flex-col justify-center flex-1 pr-2">
                      <span className="text-[10px] text-[#FA007D] font-bold uppercase mb-1">
                        {new Date(article.published_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZone: TIMEZONE 
                        })} • NBA
                      </span>
                      <h4 className="font-oswald text-xs md:text-sm lg:text-base font-bold text-gray-900 leading-snug group-hover:text-[#FA007D] line-clamp-3 uppercase transition-colors">
                        {article.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
             {heroBottom.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                   <div className="aspect-[16/10] overflow-hidden relative rounded-2xl bg-gray-100 shadow-sm mb-3 border border-gray-100">
                      <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        style={getObjectPositionStyle(article.image_focal_point, false)}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">NBA</div>
                   </div>
                   <h3 className="font-oswald text-sm font-bold text-gray-900 leading-tight group-hover:text-[#FA007D] line-clamp-2 uppercase transition-colors">{article.title}</h3>
                </Link>             
             ))}
          </div>
          <AmazonCTA />
        </div>
      </section>

      {/* --- WHITE MODE WRAPPER --- */}
      <div className="bg-white text-gray-900 pt-16 pb-20 rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.2)] relative z-10 mt-[-20px]">
        <div className="container mx-auto px-4">
          
          {/* --- SEÇÃO 2: GIRO DA RODADA (0-3) --- */}
          <section className="mb-24">
            <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-2">
               <h2 className="text-3xl font-oswald font-bold text-black uppercase tracking-tighter">⚡ Giro da Rodada</h2>
               <span className="text-xs font-bold font-mono text-gray-500">ATUALIZAÇÕES RÁPIDAS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {otherArticles.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block">
                  <div className="aspect-video w-full overflow-hidden relative rounded-lg mb-4 shadow-md group-hover:shadow-xl transition-all duration-300 bg-gray-100">
                    <ImageWithFallback src={article.image_url} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt={article.title} />
                  </div>
                  <div className="pr-4">
                    <span className="text-xs font-bold text-pink-600 uppercase mb-2 block tracking-wider">
                      {new Date(article.published_at).toLocaleDateString('pt-BR', { timeZone: TIMEZONE })}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-pink-600 transition-colors font-inter">{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* --- SEÇÃO 3: EM ALTA (3-7) --- */}
          <section className="mb-24">
            <h2 className="text-2xl font-oswald font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">— Em Alta na NBA —</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherArticles.slice(3, 7).map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:-translate-y-2 transition-transform duration-300 bg-gray-100">
                  <ImageWithFallback src={article.image_url} fill className="object-cover transition-transform duration-700 group-hover:scale-110" alt={article.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-3">{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* --- SEÇÃO 4: ANÁLISES (7-10) --- */}
          <section className="mb-24 bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-1 h-8 bg-purple-600"></div>
               <h2 className="text-4xl font-bebas text-gray-900 uppercase tracking-tight">Análises & Opinião</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:min-h-[400px]">
              {otherArticles[7] && (
                <Link href={`/artigos/${otherArticles[7].slug}`} className="lg:col-span-2 group relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 h-[300px] lg:h-auto">
                  <ImageWithFallback src={otherArticles[7].image_url} fill className="object-cover transition-transform duration-700 group-hover:scale-105" alt={otherArticles[7].title} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors p-8 flex flex-col justify-end">
                    <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">DESTAQUE</span>
                    <h3 className="text-2xl md:text-4xl font-black text-white uppercase leading-none mb-2">{otherArticles[7].title}</h3>
                    <p className="text-gray-200 line-clamp-2 hidden md:block" data-nosnippet="true">{otherArticles[7].summary}</p>
                  </div>
                </Link>
              )}
              <div className="flex flex-col gap-6 h-full">
                {otherArticles.slice(8, 10).map((article) => (
                  <Link key={article.id} href={`/artigos/${article.slug}`} className="flex-1 group relative rounded-xl overflow-hidden shadow-md flex items-center bg-white border border-gray-100 min-h-[120px]">
                    <div className="w-1/3 h-full relative bg-gray-100">
                       <ImageWithFallback src={article.image_url} fill className="object-cover" alt={article.title} />
                    </div>
                    <div className="w-2/3 p-4">
                      <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-purple-600 transition-colors line-clamp-3">{article.title}</h4>
                      <span className="text-xs text-gray-400 mt-2 block">Ler Análise →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* --- SEÇÃO 5: ARQUIVO GERAL (Layout Revista / Ritmo Alternado) (10+) --- */}
          <section className="pt-16 border-t border-gray-200">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <h2 className="text-5xl font-bebas text-gray-900 tracking-tight mb-4">TODAS AS NOTÍCIAS</h2>
              <div className="w-24 h-1.5 bg-black mx-auto mb-6"></div>
              <p className="text-gray-500 font-inter">Navegue pelo nosso arquivo completo de coberturas da NBA.</p>
            </div>

            {/* GRID INTELIGENTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr grid-flow-row-dense">
              {otherArticles.slice(10).map((article, index) => {
                const i = index % 10;
                const isLarge = i === 0 || i === 6;
                
                return (
                  <Link 
                    key={article.id} 
                    href={`/artigos/${article.slug}`}
                    className={cn(
                      "group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:-translate-y-1",
                      isLarge ? 'md:col-span-2' : 'col-span-1'
                    )}
                  >
                    <div className={cn("relative overflow-hidden w-full bg-gray-100", isLarge ? 'aspect-[21/9]' : 'aspect-[4/3]')}>
                      <ImageWithFallback 
                        src={article.image_url} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={article.title}
                        style={getObjectPositionStyle(article.image_focal_point, false)}
                      />
                      <div className="absolute top-4 left-4">
                        <span className={cn("px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest", isLarge ? 'bg-black text-white' : 'bg-white text-black shadow-md')}>
                          {isLarge ? 'Destaque' : 'NBA'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                        <span>{new Date(article.published_at).toLocaleDateString('pt-BR', { timeZone: TIMEZONE })}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>Leitura Rápida</span>
                      </div>

                      <h3 className={cn("font-bold text-gray-900 leading-tight mb-3 group-hover:text-pink-600 transition-colors font-oswald uppercase", isLarge ? 'text-2xl md:text-3xl' : 'text-xl')}>
                        {article.title}
                      </h3>
                      
                      <p className={cn("text-gray-500 font-inter leading-relaxed mb-6 line-clamp-2", isLarge ? 'text-base' : 'text-sm')} data-nosnippet="true">
                        {article.summary}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-200">
                         <span className="text-sm font-bold text-gray-900">Ler Matéria</span>
                         <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">↗</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Botão Carregar Mais */}
            <div className="mt-20 flex justify-center">
              <Link href="/ultimas" className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200">
                <span className="relative z-10 font-black uppercase tracking-widest text-sm group-hover:text-white transition-colors duration-200">
                  Ver Histórico Completo
                </span>
                <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-black/100"></div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}