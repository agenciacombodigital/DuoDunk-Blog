import { supabaseServer } from '@/integrations/supabase/server';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback'; 
import { TrendingUp, Clock, Newspaper } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import AmazonCTA from '@/components/AmazonCTA';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Garantir dados sempre frescos para depuração

export const metadata: Metadata = {
  title: 'DuoDunk | O Melhor Portal de NBA do Brasil',
  description: 'Notícias, estatísticas, rumores e o Quiz do Milhão. Acompanhe tudo sobre a NBA em tempo real.',
};

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
}

const TIMEZONE = 'America/Sao_Paulo';

function getTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return diffInDays === 1 ? '1d' : `${diffInDays}d`;
  } catch (e) {
    return 'N/D';
  }
}

async function loadArticles(): Promise<Article[]> {
  try {
    console.log('[Home] Iniciando busca de artigos no Supabase...');
    const { data, error } = await supabaseServer
      .from('articles')
      .select('id, title, subtitle, slug, summary, image_url, source, tags, published_at, image_focal_point, is_featured')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('[Home] Erro do Supabase ao buscar artigos:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return [];
    }

    console.log(`[Home] Busca concluída. Artigos encontrados: ${data?.length || 0}`);
    return data || [];
  } catch (e: any) {
    console.error('[Home] Erro fatal (Exception) no fetch de artigos:', e.message);
    return [];
  }
}

export default async function Home() {
  const articles = await loadArticles();

  // Se o banco estiver vazio ou a consulta falhar, exibimos este estado
  // Isso evita que o Next.js considere a página como "NotFound"
  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="bg-gray-100 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Newspaper className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-3xl font-oswald font-bold text-gray-900 uppercase mb-4">Nenhuma notícia disponível</h2>
          <p className="text-gray-500 font-inter max-w-md mx-auto mb-8">
            Não conseguimos carregar as notícias no momento. Pode ser que não existam posts publicados ou o servidor esteja em manutenção.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link href="/ultimas" className="btn-magenta">Ver Últimas Notícias</Link>
             <button onClick={() => { /* Recarregar */ }} className="px-8 py-3 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 transition-colors">Atualizar Página</button>
          </div>
        </div>
      </div>
    );
  }

  const featured = articles.find(a => a.is_featured) || articles[0];
  const remaining = articles.filter(a => a.id !== featured.id);

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-inter">
      <section className="bg-white text-gray-900 pb-10">
        <div className="container mx-auto px-4 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Link href={`/artigos/${featured.slug}`} className="group block relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
                <ImageWithFallback
                  src={featured.image_url}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  style={getObjectPositionStyle(featured.image_focal_point, false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-8 md:p-12 w-full z-10">
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

            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                <TrendingUp className="text-[#FA007D]" size={20} />
                <h3 className="font-bebas text-2xl text-gray-900 uppercase">Giro NBA</h3>
              </div>
              
              {remaining.slice(0, 3).map((article) => (
                <Link key={article.id} href={`/artigos/${article.slug}`} className="group flex gap-4 items-center bg-gray-50 p-3 rounded-2xl hover:bg-gray-100 transition border border-gray-100 shadow-sm">
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-200">
                    <ImageWithFallback src={article.image_url} fill className="object-cover" alt={article.title} />
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <span className="text-[10px] text-[#FA007D] font-bold uppercase mb-1">{getTimeAgo(article.published_at)}</span>
                    <h4 className="font-oswald text-sm font-bold text-gray-900 leading-snug group-hover:text-[#FA007D] line-clamp-2 uppercase">{article.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="mt-12">
            <AmazonCTA />
          </div>
        </div>
      </section>
    </div>
  );
}