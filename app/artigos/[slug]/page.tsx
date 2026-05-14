import { supabaseServer } from '@/integrations/supabase/server';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback'; 
import { getObjectPositionStyle } from '@/lib/utils';
import { Metadata, ResolvingMetadata } from 'next';
import ArticleBody from '@/components/ArticleBody';
import nextDynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Script from 'next/script';

// Imports Dinâmicos
const VideoEmbed = nextDynamic(() => import('@/components/VideoEmbed'), { ssr: false });
const DisqusComments = nextDynamic(() => import('@/components/DisqusComments'), { ssr: false });
const LatestNews = nextDynamic(() => import('@/components/LatestNews'), { ssr: true });
const AmazonCTA = nextDynamic(() => import('@/components/AmazonCTA'), { ssr: true });

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticle(slug: string) {
  try {
    console.log(`[Artigo] Tentando carregar o slug: "${slug}"`);
    
    // 1. Busca tentando encontrar o artigo publicado
    const { data, error } = await supabaseServer
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();
    
    if (error) {
      console.error(`[Artigo] Erro de consulta para slug "${slug}":`, {
        message: error.message,
        code: error.code
      });
      return null;
    }

    if (!data) {
      // 2. Log de diagnóstico: Existe o slug, mas não está publicado?
      const { data: checkAny } = await supabaseServer
        .from('articles')
        .select('id, title, published, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (checkAny) {
        console.warn(`[Artigo] Slug "${slug}" encontrado, mas não exibido. Status: published=${checkAny.published}`);
      } else {
        console.error(`[Artigo] Slug "${slug}" absolutamente não encontrado no banco.`);
      }
      return null;
    }

    console.log(`[Artigo] Sucesso! Artigo "${data.title}" carregado.`);
    return data;
  } catch (e: any) {
    console.error(`[Artigo] Exceção crítica durante getArticle("${slug}"):`, e.message);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Artigo não encontrado | Duo Dunk' };

  return {
    title: article.title,
    description: article.meta_description || article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      images: [article.image_url || '/images/card-twitter-duodunk.jpg'],
    },
  };
}

export default async function Artigo({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  
  // Se não encontrar o artigo após os logs, aí sim disparamos o notFound do Next.js
  if (!article) {
    notFound();
  }

  const date = new Date(article.published_at);
  const publishedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const publishedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white text-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <article>
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors mb-8 font-bold font-inter text-sm uppercase">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>

            <h1 className="font-oswald text-4xl md:text-6xl font-bold uppercase text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-8 text-sm text-gray-500 border-b border-gray-100 pb-6 font-inter">
               <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                 {article.author?.charAt(0) || 'D'}
               </div>
               <div>
                 <p className="font-bold text-gray-900">Por {article.author || 'Duo Dunk Redação'}</p>
                 <p>{publishedDate} às {publishedTime}</p>
               </div>
            </div>

            {article.image_url && (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10 shadow-lg bg-gray-100">
                 <ImageWithFallback
                    src={article.image_url}
                    alt={article.title}
                    fill
                    priority
                    className="object-cover"
                    style={getObjectPositionStyle(article.image_focal_point, false)}
                 />
              </div>
            )}

            {article.video_url && <div className="mb-10"><VideoEmbed url={article.video_url} /></div>}

            <ArticleBody content={article.body} />
            
            <div className="my-12">
                <AmazonCTA />
            </div>
          </article>
        </div>
      </div>

      <div className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4 max-w-5xl">
           <h2 className="font-bebas text-3xl text-gray-900 mb-8">Continue Lendo</h2>
           <LatestNews currentPostId={article.id} limit={3} />
           <div className="mt-12">
              <DisqusComments identifier={article.slug} title={article.title} url={`https://www.duodunk.com.br/artigos/${article.slug}`} />
           </div>
        </div>
      </div>
    </div>
  );
}