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
  created_at: string; // Adicionado para compatibilidade com o snippet do usuário
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
    .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, created_at, image_focal_point, image_focal_point_mobile, is_featured, author')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(100); 
  return data || [];
}

export default async function Home() {
  const articles = await loadArticles();
  if (articles.length === 0) return null;

  // Distribuição dos Artigos para o Hero
  const featured = articles.find(a => a.is_featured) || articles[0];
  const remaining = articles.filter(a => a.id !== featured.id);
  
  const heroSidebar = remaining.slice(0, 3);
  const heroBottom = remaining.slice(3, 7);
  
  // Artigos para as seções inferiores (começam após o Hero)
  const otherArticles = remaining.slice(7);

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-inter">
      
      {/* --- SEÇÃO 1: HERO (Destaque Principal e Sidebar Alinhada) - Fundo Branco Mantido para Contraste Superior --- */}
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

            {/* SIDEBAR (3 Notícias) */}
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
                        {new Date(article.published_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • NBA
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

          {/* 4 Cards menores abaixo do Hero */}
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

      <div className="container mx-auto px-4">
        {/* =====================================================================================
            SEÇÃO 2: DESTAQUES RÁPIDOS (3 Colunas com Imagens)
            Usa os artigos do índice 0 ao 2 de 'otherArticles'
           ===================================================================================== */}
        <section className="mb-20 mt-12">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-2">
             <span className="text-yellow-400 text-xl">⚡</span>
             <h2 className="text-2xl font-oswald text-white uppercase tracking-wide">
               Giro da Rodada
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {otherArticles.slice(0, 3).map((article) => (
              <Link 
                key={article.id} 
                href={`/artigos/${article.slug}`}
                className="group block bg-gray-900 rounded-xl overflow-hidden border border-white/5 hover:border-yellow-500/50 transition-all duration-300"
              >
                {/* IMAGEM OBRIGATÓRIA */}
                <div className="aspect-video w-full overflow-hidden relative">
                  <img 
                    src={article.image_url} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={article.title}
                    onError={(e) => e.currentTarget.src = 'https://duodunk.com.br/images/agenda-nba-padrao.jpg'}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white leading-tight group-hover:text-yellow-400 transition-colors font-oswald uppercase">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================================
            SEÇÃO 3: ANÁLISES TÁTICAS (2 Colunas Grandes com Imagens de Fundo)
            Usa os artigos do índice 3 ao 4 de 'otherArticles'
           ===================================================================================== */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-6">
             <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
             <h2 className="text-2xl font-oswald text-white uppercase tracking-wide">
               Análises & Opinião
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherArticles.slice(3, 5).map((article) => (
              <Link 
                key={article.id} 
                href={`/artigos/${article.slug}`}
                className="group relative h-[320px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              >
                {/* IMAGEM FUNDO TOTAL */}
                <img 
                  src={article.image_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-50 group-hover:brightness-75"
                  alt={article.title}
                  onError={(e) => e.currentTarget.src = 'https://duodunk.com.br/images/agenda-nba-padrao.jpg'}
                />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider shadow-lg">
                    Deep Dive
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase leading-none drop-shadow-lg">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================================
            SEÇÃO 4: ARQUIVO GERAL (Grid Mosaico com Imagens)
            Usa o restante dos artigos (índice 5 em diante)
           ===================================================================================== */}
        <section className="py-10 border-t border-gray-800">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-4xl font-bebas text-white tracking-tight">
                ARQUIVO <span className="text-pink-600">&</span> NOTÍCIAS
              </h2>
              <p className="text-gray-400 text-sm mt-1 font-inter">Cobertura completa da temporada.</p>
            </div>
            <Link href="/ultimas" className="text-pink-600 text-sm font-bold hover:text-white transition-colors flex items-center gap-1 group">
              VER TODAS <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* GRID MOSAICO PREMIUM */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherArticles.slice(5).map((article) => (
              <Link 
                key={article.id} 
                href={`/artigos/${article.slug}`}
                className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-pink-500/30 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10"
              >
                {/* IMAGEM OBRIGATÓRIA */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-800">
                  <img 
                    src={article.image_url} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => e.currentTarget.src = 'https://duodunk.com.br/images/agenda-nba-padrao.jpg'}
                    alt={article.title}
                  />
                  {/* Badge de Data sobre a imagem */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                    {new Date(article.published_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* CONTEÚDO */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-white leading-snug mb-3 group-hover:text-pink-500 transition-colors line-clamp-3 font-inter">
                    {article.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-pink-500">
                         {article.author ? article.author.charAt(0) : 'D'}
                       </div>
                       <span className="text-gray-500 font-medium">DuoDunk</span>
                     </div>
                     <span className="text-pink-500 font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                       Ler Matéria →
                     </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/ultimas" className="btn-magenta inline-flex items-center gap-3 px-12 uppercase tracking-widest text-sm">
              Ver Histórico Completo <ArrowRight size={18}/>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}