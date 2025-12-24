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
      
      {/* --- SEÇÃO 1: HERO (Destaque + Sidebar Premium) --- */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          
          {/* DESTAQUE PRINCIPAL (Ocupa 2 colunas) */}
          <div className="lg:col-span-2 relative group rounded-2xl overflow-hidden h-[450px] shadow-2xl bg-gray-100">
            <Link href={`/artigos/${featured.slug}`} className="block h-full">
              <ImageWithFallback
                src={featured.image_url}
                alt={featured.title}
                fill
                priority={true}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                style={getObjectPositionStyle(featured.image_focal_point, false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-8 flex flex-col justify-end">
                <span className="bg-[#FA007D] text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-widest">
                  DESTAQUE
                </span>
                <h1 className="text-3xl md:text-5xl font-oswald font-bold text-white leading-tight mb-4 uppercase group-hover:text-[#00DBFB] transition-colors">
                  {featured.title}
                </h1>
                <p className="text-gray-300 line-clamp-2 text-sm md:text-base max-w-2xl font-inter leading-relaxed">
                  {featured.summary}
                </p>
                <div className="flex items-center gap-3 text-gray-400 text-[11px] font-bold uppercase mt-6 tracking-widest border-t border-white/10 pt-4">
                  <span className="flex items-center gap-1"><Clock size={12}/> {getTimeAgo(featured.published_at)}</span>
                  <span>•</span>
                  <span>NBA</span>
                </div>
              </div>
            </Link>
          </div>

          {/* SIDEBAR (Ocupa 1 coluna) */}
          <div className="lg:col-span-1 flex flex-col justify-between h-[450px] gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="h-2 w-2 bg-[#FA007D] rounded-full animate-pulse" />
              <h3 className="text-lg font-bebas text-gray-900 tracking-wide uppercase">Últimas Notícias</h3>
            </div>

            {heroSidebar.map((item) => (
              <Link 
                key={item.id}
                href={`/artigos/${item.slug}`} 
                className="flex gap-4 group h-full bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:bg-gray-100 hover:border-[#FA007D]/20 transition-all flex-1 shadow-sm"
              >
                <div className="relative aspect-square h-full shrink-0 rounded-xl overflow-hidden bg-gray-200">
                  <ImageWithFallback 
                    src={item.image_url} 
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={item.title}
                    style={getObjectPositionStyle(item.image_focal_point, false)}
                  />
                </div>
                
                <div className="flex flex-col justify-center py-1 flex-1">
                  <span className="text-[10px] text-[#FA007D] font-bold uppercase mb-1 tracking-wider">
                    {getTimeAgo(item.published_at)} • NBA
                  </span>
                  <h4 className="font-oswald text-sm font-bold text-gray-900 leading-snug group-hover:text-[#FA007D] transition-colors line-clamp-3 uppercase">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 4 Cards menores abaixo do Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">NBA</span>
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
                      <div className="w-32 h-20 shrink-0 rounded-2xl overflow-hidden relative shadow-md bg-gray-100 border border-gray-100">
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

      {/* --- SEÇÃO 4: ARQUIVO E NOTÍCIAS (MOSAICO PREMIUM) --- */}
      <section className="bg-[#09090b] py-20 mt-12 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bebas text-white mb-2 tracking-wide">ARQUIVO E NOTÍCIAS</h2>
              <p className="text-gray-500 text-sm font-inter">Tudo o que acontece na maior liga do mundo</p>
            </div>
            <Link href="/ultimas" className="text-[#FA007D] text-sm font-bold hover:text-white transition-colors flex items-center gap-2 group uppercase tracking-widest">
              VER TODOS <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {archive.map((article) => (
              <Link 
                key={article.id} 
                href={`/artigos/${article.slug}`}
                className="group bg-zinc-900/50 rounded-3xl overflow-hidden border border-white/5 hover:border-[#FA007D]/40 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-900/10 flex flex-col h-full"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-800">
                  <ImageWithFallback 
                    src={article.image_url} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={article.title}
                    style={getObjectPositionStyle(article.image_focal_point, false)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 tracking-tighter">
                    {new Date(article.published_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1 relative">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FA007D]" />
                    <span className="text-[10px] font-bold text-[#FA007D] uppercase tracking-[0.2em]">{article.tags?.[0] || 'NBA'}</span>
                  </div>
                  
                  <h3 className="font-oswald text-xl font-bold text-white leading-tight mb-4 group-hover:text-[#00DBFB] transition-colors line-clamp-2 uppercase">
                    {article.title}
                  </h3>
                  
                  <p className="font-inter text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6 flex-1">
                    {article.summary}
                  </p>

                  <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#FA007D]">
                        {article.author ? article.author.charAt(0) : 'D'}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Por {article.author || 'Redação'}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-600 group-hover:text-white transition-colors">LER AGORA</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link href="/ultimas" className="btn-magenta inline-flex items-center gap-3 px-12 uppercase tracking-widest text-sm">
              Carregar Histórico Completo <ArrowRight size={18}/>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}