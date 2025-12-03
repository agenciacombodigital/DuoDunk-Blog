import { supabaseServer } from '@/integrations/supabase/server';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import DisqusComments from '@/components/DisqusComments';
import VideoEmbed from '@/components/VideoEmbed';
import LatestNews from '@/components/LatestNews';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Metadata, ResolvingMetadata } from 'next'; // Importação correta
import ArticleBody from '@/components/ArticleBody';
import AmazonCTA from '@/components/AmazonCTA';

// ⚠️ Configurações de Servidor
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Função para buscar dados (Reutilizável para o componente e para o Metadata)
async function getArticle(slug: string) {
  const { data } = await supabaseServer
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
    return data;
}

// ✅ GERAÇÃO DE METADATA (Isso controla o WhatsApp/Google)
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Busca os dados da notícia
  const article = await getArticle(params.slug);

  // Se não achar, retorna padrão
  if (!article) {
    return {
      title: 'Artigo não encontrado | Duo Dunk',
    };
  }

  const siteUrl = 'https://www.duodunk.com.br';
  const currentUrl = `${siteUrl}/artigos/${article.slug}`;
  
  // Define a imagem (prioriza a da notícia, senão usa logo)
  const ogImage = article.image_url 
    ? getOptimizedImageUrl(article.image_url, 1200) 
    : `${siteUrl}/images/duodunk-logoV2.svg`;

  // Define a descrição (prioriza meta_description, senão summary)
  const description = article.meta_description || article.summary || 'Notícias da NBA no Duo Dunk.';

  return {
    title: `${article.title} | Duo Dunk`,
    description: description,
    authors: [{ name: article.author || 'Duo Dunk' }],
    openGraph: {
      title: article.title,
      description: description, // <--- Isso aparece no WhatsApp
      url: currentUrl,
      siteName: 'Duo Dunk',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      publishedTime: article.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: description,
      images: [ogImage],
    },
  };
}

// --- COMPONENTE DA PÁGINA ---
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

  const date = new Date(article.published_at);
  const publishedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const safeTags = Array.isArray(article.tags) ? article.tags : [];

  return (
    <div className="bg-white text-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <article>
            {/* Navegação */}
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors mb-8 font-bold font-inter text-sm uppercase tracking-wide">
              <ArrowLeft className="w-4 h-4" /> Voltar para Home
            </Link>

            {/* Cabeçalho */}
            <h1 className="font-oswald text-4xl md:text-6xl font-bold uppercase text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            {article.subtitle && <h2 className="text-xl md:text-2xl text-gray-600 mb-6 font-inter leading-relaxed">{article.subtitle}</h2>}
            
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-500 font-inter border-y border-gray-100 py-4">
               <span className="font-bold text-pink-600 uppercase flex items-center gap-2">
                 By {article.author || 'Redação'}
               </span>
               <span className="hidden sm:inline">•</span>
               <span className="flex items-center gap-1"><Calendar size={14}/> {publishedDate}</span>
            </div>

            {/* Imagem Principal */}
            {article.image_url && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10 shadow-lg">
                 <img
                    src={getOptimizedImageUrl(article.image_url, 1200)}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    style={getObjectPositionStyle(article.image_focal_point, false)}
                 />
              </div>
            )}

            {article.video_url && <div className="mb-10"><VideoEmbed url={article.video_url} /></div>}

            {/* Corpo da Notícia */}
            <div className="max-w-none">
               <ArticleBody content={article.body} />
            </div>
            
            {/* Banner Amazon */}
            <div className="my-12">
                <AmazonCTA />
            </div>

            {/* Tags */}
            {safeTags.length > 0 && (
              <div className="pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {safeTags.map((tag: string) => (
                    <Link key={tag} href={`/ultimas?tag=${tag}`} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">#{tag}</Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>

      {/* Rodapé de Artigos Relacionados */}
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