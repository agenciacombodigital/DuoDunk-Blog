import { supabaseServer } from '@/integrations/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DisqusComments from '@/components/DisqusComments';
import VideoEmbed from '@/components/VideoEmbed';
import LatestNews from '@/components/LatestNews';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata } from 'next';
import ArticleBody from '@/components/ArticleBody';
import AmazonCTA from '@/components/AmazonCTA';

// ✅ CORREÇÃO FINAL: Força o Next.js a NÃO usar cache nesta página.
// Isso garante que se o artigo for atualizado ou recriado, o site mostra a versão nova.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const formatDateTime = (dateString: string, includeTime: boolean = true): string => {
  try {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' };
    const formattedDate = date.toLocaleDateString('pt-BR', dateOptions).replace(/\./g, '');
    if (includeTime) {
      const time = date.toLocaleTimeString('pt-BR', timeOptions);
      return `${formattedDate}, ${time}`;
    }
    return formattedDate;
  } catch (e) { return 'Data Indisponível'; }
};

async function getArticle(slug: string) {
  const { data } = await supabaseServer
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle(); // Usa maybeSingle para não dar erro 406 se tiver duplicado (pega o primeiro)
    return data;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Artigo não encontrado' };
  
  const siteUrl = 'https://www.duodunk.com.br';
  const currentUrl = `${siteUrl}/artigos/${article.slug}`;
  const imageUrl = article.image_url || `${siteUrl}/images/duodunk-logoV2.svg`;
  
  return {
    title: `${article.title} | Duo Dunk`,
    description: article.meta_description || article.summary,
    openGraph: {
      title: article.title,
      description: article.meta_description || article.summary,
      url: currentUrl,
      images: [{ url: imageUrl }],
      type: 'article',
      authors: [article.author || 'Duo Dunk'],
    },
  };
}

export default async function Artigo({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-oswald">Artigo não encontrado (404)</h1>
          <Link href="/" className="text-pink-600 hover:text-black transition-colors font-bold">Voltar para Home</Link>
        </div>
      </div>
    );
  }

  const publishedDate = formatDateTime(article.published_at);
  const isUpdated = article.updated_at && new Date(article.updated_at).getTime() > new Date(article.published_at).getTime() + 60000;
  const updatedDate = isUpdated ? formatDateTime(article.updated_at) : null;
  const safeTags = Array.isArray(article.tags) ? article.tags : [];

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <article>
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-8 font-bold font-inter">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <h1 className="font-oswald text-3xl md:text-5xl font-bold uppercase text-gray-900 mb-2 leading-tight">
              {article.title}
            </h1>
            {/* REMOVIDO: uppercase */}
            {article.subtitle && <h2 className="text-xl text-gray-700 mb-4 font-inter font-medium">{article.subtitle}</h2>}
            
            {/* Bloco de Metadados em Duas Linhas */}
            <div className="flex flex-col gap-1 mb-4 text-sm text-gray-500 font-inter">
               <span className="font-bold text-gray-700">Por {article.author || 'Redação'}</span>
               <div className="flex items-center gap-3">
                 <span className="text-gray-500">Postado em {publishedDate}</span>
                 {isUpdated && <span className="italic text-gray-400">(Atualizado: {updatedDate})</span>}
               </div>
            </div>

            {article.image_url && (
              <img
                src={getOptimizedImageUrl(article.image_url, 800)}
                alt={article.title}
                className="w-full h-auto rounded-xl object-cover mb-8 shadow-lg"
                style={{ maxHeight: '500px', ...getObjectPositionStyle(article.image_focal_point, false) }}
              />
            )}

            {article.video_url && <VideoEmbed url={article.video_url} />}

            {/* Corpo da Notícia com Renderização Segura */}
            <ArticleBody content={article.body} />
            
            {/* Banner Amazon */}
            <div className="my-10">
                <AmazonCTA />
            </div>

            {safeTags.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {safeTags.map((tag: string) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase hover:bg-gray-200 transition-colors">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl pb-12">
         <div className="h-px bg-gray-200 my-12" />
         <h2 className="font-bebas text-3xl text-gray-900 mb-6">Veja Também</h2>
         <LatestNews currentPostId={article.id} limit={3} />
         <div className="mt-12">
            <DisqusComments identifier={article.slug} title={article.title} url={`https://www.duodunk.com.br/artigos/${article.slug}`} />
         </div>
      </div>
    </div>
  );
}