import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import Image from 'next/image'; // Importando Image
import { TrendingUp, Clock, Star, Zap, BarChart2, BookOpen, ArrowRight, Eye } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { Metadata } from 'next';
import AmazonCTA from '@/components/AmazonCTA';
import { cn } from '@/lib/utils';

// ✅ PERFORMANCE: Cache de 60 segundos. 
// O site fica instantâneo (vem do cache da Vercel/Edge) e atualiza a cada minuto.
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
  try {
    const { data, error } = await supabaseServer
      .from('articles')
      .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, image_focal_point, is_featured, author')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("❌ Erro ao buscar artigos do Supabase:", error);
      // Se houver erro, retornamos um array vazio, mas o erro é logado.
      return [];
    }
    return data || [];
  } catch (e) { 
    console.error("❌ Erro de conexão ou execução em loadArticles:", e);
    return []; 
  }
}

export default async function Home() {
  const articles = await loadArticles();
  
  if (articles.length === 0) {
    // Se não houver artigos, exibe uma mensagem clara
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="font-oswald text-3xl text-gray-900 mb-4">Nenhuma notícia encontrada.</h1>
          <p className="text-gray-600">Verifique a conexão com o banco de dados ou se há artigos publicados.</p>
        </div>
      </div>
    );
  }

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const otherArticles = articles.filter((a) => a.id !== featuredArticle?.id);
  
  // Fatiamento Estratégico
  const sidebarArticles = otherArticles.slice(0, 3);
  const bottomHeroArticles = otherArticles.slice(3, 7);
  const mustRead = otherArticles.slice(7, 10);
  const deepDive = otherArticles.slice(10, 13);
  const trending = otherArticles.slice(13, 17);
  const moreNews = otherArticles.slice(17, 32); // Limite de 15
  const archive = otherArticles.slice(32); // Restante

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 font-inter">
      
      {/* SEÇÃO 1: HERO */}
      <section className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Destaque Principal (LCP - Largest Contentful Paint) */}
          <div className="lg:col-span-8">
            <Link href={`/artigos/${featuredArticle.slug}`} className="group block relative w-full aspect-[3/4] lg:aspect-[16/10] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={featuredArticle.image_url}
                alt={featuredArticle.title}
                fill
                priority={true} // ✅ TASK 1.1: Priority para LCP
                sizes="100vw" // ✅ TASK 1.1: Sizes para LCP
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                style={getObjectPositionStyle(featuredArticle.image_focal_point, false)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 p-6 md:p-10 w-full z-10">
                <span className="bg-[#FA007D] text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 inline-block">Destaque</span>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-oswald font-bold text-white leading-tight mb-2 group-hover:text-[#00DBFB] transition-colors uppercase">
                  {featuredArticle.title}
                </h1>
                <div className="flex items-center gap-3 text-gray-300 text-xs font-inter uppercase tracking-widest mt-2">
                  <span className="flex items-center gap-1"><Clock size={12}/> {getTimeAgo(featuredArticle.published_at)}</span>
                  {/* Removido o nome do autor aqui */}
                </div>
              </div>
            </Link>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
              <TrendingUp className="text-[#FA007D]" size={20} />
              {/* ✅ TASK 2.4: Título Otimizado */}
              <h2 className="font-bebas text-2xl text-gray-900">Últimas Notícias da NBA</h2>
            </div>
            <div className="flex flex-col justify-between gap-3 flex-1">
              {sidebarArticles.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-3 items-stretch flex-1">
                  {/* Ajuste para w-40 e aspect-video (16/9) */}
                  <div className="relative w-40 shrink-0 rounded-lg overflow-hidden aspect-video bg-gray-100">
                     <Image 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        loading="lazy"
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
          
          {/* Linha Inferior */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
             {bottomHeroArticles.map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
                   <div className="aspect-video overflow-hidden relative bg-gray-100">
                      <Image 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={article.title}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-black text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                        {article.tags?.[0] || 'NBA'}
                      </div>
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

      {/* === SEÇÃO 2: IMPERDÍVEL === */}
      {mustRead.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-8">
             <Zap className="text-yellow-500 w-6 h-6" />
             {/* ✅ TASK 2.4: Título Otimizado */}
             <h2 className="font-bebas text-4xl text-gray-900">Destaques e Jogos de Hoje</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {mustRead.map(article => (
               <Link key={article.id} href={`/artigos/${article.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                     <Image 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={article.title}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                     <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
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

      {/* === SEÇÃO 3: ANÁLISES === */}
      {deepDive.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
               <h2 className="font-bebas text-4xl text-gray-900 flex items-center gap-2"><BarChart2 className="text-purple-600"/> Análises</h2>
               <Link href="/ultimas" className="text-sm font-bold uppercase flex items-center gap-1 hover:text-purple-600 transition-colors">Ver todas <ArrowRight size={16}/></Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Link href={`/artigos/${deepDive[0].slug}`} className="group relative h-96 lg:h-auto rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                  <Image 
                    src={deepDive[0].image_url} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={deepDive[0].title}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-8 w-full">
                     <span className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold uppercase mb-3 inline-block">Análise</span>
                     <h3 className="font-oswald text-3xl md:text-4xl font-bold text-white leading-none group-hover:text-purple-300 transition-colors uppercase">{deepDive[0].title}</h3>
                  </div>
               </Link>
               <div className="flex flex-col gap-6">
                  {deepDive.slice(1).map(article => (
                    <Link key={article.id} href={`/artigos/${article.slug}`} className="flex gap-4 group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all h-full">
                       <div className="w-1/3 relative rounded-lg overflow-hidden aspect-video bg-gray-100">
                          <Image 
                            src={article.image_url} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform" 
                            alt={article.title}
                            loading="lazy"
                            sizes="33vw"
                          />
                       </div>
                       <div className="w-2/3 flex flex-col justify-center">
                          <span className="text-xs font-bold text-purple-600 uppercase mb-1">Opinião</span>
                          <h3 className="font-oswald text-lg md:text-xl font-bold text-gray-900 leading-tight group-hover:text-purple-600 transition-colors line-clamp-3 uppercase">{article.title}</h3>
                       </div>
                    </Link>
                  ))}
               </div>
            </div>
          </div>
        </section>
      )}

      {/* === SEÇÃO 4: EM ALTA (Com Imagens) === */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          {/* ✅ TASK 2.4: Título Otimizado */}
          <h2 className="font-bebas text-4xl text-gray-900 mb-10 text-center">Onde Assistir e Mais Lidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {trending.map((article, idx) => (
               <Link key={article.id} href={`/artigos/${article.slug}`} className="group relative block rounded-xl overflow-hidden bg-gray-100">
                  <div className="aspect-[4/3] overflow-hidden mb-3 relative">
                    <Image 
                      src={article.image_url} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      alt={article.title}
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute top-0 left-0 bg-[#FA007D] text-white font-bebas text-2xl px-3 py-1 rounded-br-lg shadow-md">
                       0{idx+1}
                    </div>
                  </div>
                  <h3 className="font-oswald text-lg font-bold text-gray-900 leading-snug group-hover:text-[#FA007D] transition-colors line-clamp-3 uppercase">
                    {article.title}
                  </h3>
               </Link>
             ))}
          </div>
        </section>
      )}

      {/* === SEÇÃO 5: MAIS NOTÍCIAS (Lista 15) === */}
      {moreNews.length > 0 && (
        <section className="bg-gray-50 py-16 border-y border-gray-200">
           <div className="container mx-auto px-4">
             <div className="flex items-center justify-between mb-8">
                <h2 className="font-bebas text-4xl text-gray-900 flex items-center gap-2"><Eye className="text-blue-500"/> Mais Notícias</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {moreNews.map((article) => (
                   <Link key={article.id} href={`/artigos/${article.slug}`} className="flex items-start gap-4 group py-2 border-b border-gray-200 last:border-0 hover:bg-white rounded-lg transition p-2">
                      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                         <Image 
                            src={article.image_url} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform" 
                            alt={article.title}
                            loading="lazy"
                            sizes="100px"
                          />
                      </div>
                      <div>
                         <h3 className="font-oswald text-base font-bold text-gray-800 leading-tight group-hover:text-blue-600 line-clamp-2 mb-1 uppercase">
                            {article.title}
                         </h3>
                         <span className="text-xs text-gray-400">{getTimeAgo(article.published_at)}</span>
                      </div>
                   </Link>
                ))}
             </div>
           </div>
        </section>
      )}

      {/* === SEÇÃO FINAL: ARQUIVO (Mosaico Criativo) === */}
      {archive.length > 0 && (
        <section className="container mx-auto px-4 py-16">
           <div className="flex items-center gap-4 mb-10">
              <h2 className="font-bebas text-4xl text-black flex items-center gap-2">
                 <BookOpen className="text-gray-400"/> Arquivo
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
           </div>
           
           {/* Grid Mosaico */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
              {archive.map((article, idx) => {
                 const pattern = idx % 10; // Padrão de repetição
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
                      <Image 
                        src={article.image_url} 
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={article.title}
                        loading="lazy"
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
           <div className="mt-12 text-center">
              <Link href="/ultimas" className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full font-bold font-oswald uppercase hover:bg-[#FA007D] transition-colors">Ver Tudo <ArrowRight size={16} /></Link>
           </div>
        </section>
      )}
    </div>
  );
}