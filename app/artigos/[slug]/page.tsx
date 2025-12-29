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

// Imports Dinâmicos
const VideoEmbed = nextDynamic(() => import('@/components/VideoEmbed'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-2xl mb-10" /> });
const DisqusComments = nextDynamic(() => import('@/components/DisqusComments'), { ssr: false });
const LatestNews = nextDynamic(() => import('@/components/LatestNews'), { ssr: true });
const AmazonCTA = nextDynamic(() => import('@/components/AmazonCTA'), { ssr: true });

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticle(slug: string) {
  const { data } = await supabaseServer
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
    return data;
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const article = await getArticle(params.slug);
  const siteUrl = 'https://www.duodunk.com.br';
  
  if (!article) return { title: 'Artigo não encontrado | Duo Dunk' };

  const currentUrl = `${siteUrl}/artigos/${article.slug}`;
  const ogImage = article.image_url || `${siteUrl}/images/card-twitter-duodunk.jpg`;
  const description = article.meta_description || article.summary || 'Acompanhe as últimas notícias da NBA em tempo real no Duo Dunk. O melhor do basquete está aqui!';

  return {
    title: article.title,
    description: description,
    alternates: { canonical: currentUrl },
    openGraph: {
      title: article.title,
      description: description,
      url: currentUrl,
      siteName: 'Duo Dunk',
      images: [{ url: ogImage, width: 1200, height: 628, alt: article.title }],
      locale: 'pt_BR',
      type: 'article',
    },
    twitter: {
      card: "summary_large_image",
      site: "@duodunk",
      title: article.title,
      description: description,
      images: [ogImage],
    },
  };
}

export default async function Artigo({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const date = new Date(article.published_at);
  const timeZone = 'America/Sao_Paulo';
  
  const publishedDate = date.toLocaleDateString('pt-BR', { 
    day: '2-digit', month: 'short', year: 'numeric', timeZone 
  });
  const publishedTime = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', minute: '2-digit', timeZone 
  });
  
  const leadText = article.subtitle || article.summary;

  return (
    <div className="bg-white text-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <article>
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors mb-8 font-bold font-inter text-sm uppercase tracking-wide">
              <ArrowLeft className="w-4 h-4" /> Voltar para Home
            </Link>

            <h1 className="font-oswald text-4xl md:text-6xl font-bold uppercase text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            
            {leadText && (
              <h2 className="text-lg md:text-xl text-gray-600 mb-6 font-inter leading-relaxed normal-case">
                {leadText}
              </h2>
            )}
            
            <div className="flex flex-col items-start gap-1 mb-8 text-sm text-gray-500 font-inter">
               <span className="font-bold text-[#FA007D]">
                 Por {article.author || 'Redação Duo Dunk'}
               </span>
               <span>
                 Postado em {publishedDate} às {publishedTime}
               </span>
            </div>

            {article.image_url && (
              <div className={cn(
                "relative w-full rounded-2xl overflow-hidden mb-10 shadow-lg bg-gray-100",
                "aspect-[4/3] md:aspect-video"
              )}>
                 <ImageWithFallback
                    src={article.image_url}
                    alt={article.title}
                    fill
                    priority={true}
                    className="object-cover"
                    style={getObjectPositionStyle(article.image_focal_point, false)}
                    sizes="(max-width: 768px) 100vw, 800px"
                 />
              </div>
            )}

            {article.video_url && <div className="mb-10"><VideoEmbed url={article.video_url} /></div>}

            <ArticleBody content={article.body} />
            
            <div className="my-12">
                <AmazonCTA />
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <Link key={tag} href={`/ultimas?tag=${tag}`} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">#{tag}</Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>

      <div className="bg-gray-50 py-12 mt-12">
        <div className="container mx-auto px-4 max-w-5xl">
           <h2 className="font-bebas text-3xl text-gray-900 mb-8 border-l-4 border-pink-600 pl-3">Continue Lendo</h2>
           <LatestNews currentPostId={article.id} limit={3} />
           <div className="mt-12">
              <DisqusComments identifier={article.slug} title={article.title} url={`https://www.duodunk.com.br/artigos/${article.slug}`} />
           </div>
        </div>
      </div>
    </div>
  );
}