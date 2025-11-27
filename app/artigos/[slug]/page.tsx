import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DisqusComments from '@/components/DisqusComments';
import VideoEmbed from '@/components/VideoEmbed';
import LatestNews from '@/components/LatestNews';
import { getObjectPositionStyle } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import ArticleMeta from '@/components/ArticleMeta';
import AmazonCTA from '@/components/AmazonCTA'; // Importando o novo componente

// Helper para formatar a data no estilo "DD MMM YYYY, HH:MM"
const formatDateTime = (dateString: string, includeTime: boolean = true): string => {
  try {
    const date = new Date(dateString);
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    };

    const formattedDate = date.toLocaleDateString('pt-BR', dateOptions).replace(/\./g, ''); // Ex: 20 nov 2025
    
    if (includeTime) {
      const time = date.toLocaleTimeString('pt-BR', timeOptions); // Ex: 11:25
      return `${formattedDate}, ${time}`; // Ex: 20 nov 2025, 11:25
    }
    
    return formattedDate;

  } catch (e) {
    return 'Data Indisponível';
  }
};

// Função de busca de dados no servidor (SSR)
async function getArticle(slug: string) {
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  
  return data;
}

// Função de metadados dinâmicos (SSR)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return {
      title: 'Artigo não encontrado',
      description: 'O artigo solicitado não existe ou foi removido.',
    };
  }

  const siteUrl = 'https://www.duodunk.com.br';
  const currentUrl = `${siteUrl}/artigos/${article.slug}`;
  const imageUrl = article.image_url || `${siteUrl}/images/duodunk-logoV2.svg`;
  const summary = article.meta_description || article.summary || article.title;
  const authorName = article.source?.includes('DuoDunk') || article.source?.includes('Editorial') ? 'Fernando Balley' : article.source || 'Duo Dunk Redação';
  const articleKeywords = article.tags && article.tags.length > 0
    ? [...new Set(article.tags)].join(', ')
    : 'NBA, Basquete, Notícias, NBA Brasil';

  return {
    title: `${article.title} | Duo Dunk`,
    description: summary,
    keywords: articleKeywords,
    alternates: {
      canonical: currentUrl,
    },
    openGraph: {
      title: article.title,
      description: summary,
      url: currentUrl,
      images: [{ url: imageUrl }],
      type: 'article',
      publishedTime: new Date(article.published_at).toISOString(),
      modifiedTime: article.updated_at ? new Date(article.updated_at).toISOString() : new Date(article.published_at).toISOString(),
      authors: [authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: summary,
      images: [imageUrl],
    },
  };
}

export default async function Artigo({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-oswald">
            Artigo não encontrado
          </h1>
          <Link 
            href="/" 
            className="text-[#00DBFB] hover:text-[#FA007D] transition-colors inline-flex items-center gap-2 font-inter"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  // Nota: A lógica de incremento de views deve ser movida para uma API Route ou Edge Function
  // para evitar que o Server Component a execute em cada rastreamento do Googlebot.
  // Por enquanto, mantemos a busca de dados pura.

  const isHtmlContent = /<[a-z][\s\S]*>/i.test(article.body);
  
  const renderBody = () => {
    if (isHtmlContent) {
      return (
        <div 
          className="prose prose-lg max-w-none mb-12 font-inter"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body) }}
        />
      );
    }
    
    return (
      <div className="prose prose-lg max-w-none mb-12 font-inter">
        {article.body.split('\n\n').map((paragraph: string, index: number) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };
  
  let articleAuthor = "Duo Dunk";
  const lowerSource = article.source ? article.source.toLowerCase() : '';
  
  if (lowerSource.includes('yahoo sports')) {
    articleAuthor = "Hugo Tamura";
  } else if (lowerSource.includes('espn')) {
    articleAuthor = "Maiara Pires";
  } else if (lowerSource.includes('duodunk') || lowerSource.includes('editorial') || lowerSource.includes('auto-gerado')) {
    articleAuthor = "Fernando Balley";
  } else if (article.source) {
    articleAuthor = article.source;
  }
  
  const publishedDate = formatDateTime(article.published_at);
  const isUpdated = article.updated_at && new Date(article.updated_at).getTime() > new Date(article.published_at).getTime() + 60000;
  const updatedDate = isUpdated ? formatDateTime(article.updated_at) : null;

  return (
    <>
      {/* ArticleMeta foi substituído por generateMetadata */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <article>
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FA007D] transition-colors mb-8 font-semibold font-inter"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>

              <h1 className="font-oswald text-3xl md:text-6xl font-bold uppercase text-gray-900 mb-4 leading-tight tracking-wide">
                {article.title}
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed font-inter">
                {article.summary}
              </p>
              
              <div className="text-sm text-gray-600 mb-8 font-inter space-y-1">
                <p className="font-bold">Por {articleAuthor}</p>
                <p className="text-xs">
                  Postado em {publishedDate}
                  {isUpdated && (
                    <span className="ml-2 text-gray-500 italic">
                      (Atualizado em {updatedDate})
                    </span>
                  )}
                </p>
              </div>

              {article.image_url && (
                <img
                  src={getOptimizedImageUrl(article.image_url, 800)}
                  srcSet={`
                    ${getOptimizedImageUrl(article.image_url, 400)} 400w,
                    ${getOptimizedImageUrl(article.image_url, 800)} 800w,
                    ${getOptimizedImageUrl(article.image_url, 1200)} 1200w
                  `}
                  sizes="(max-width: 1023px) 100vw, 800px"
                  alt={article.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto rounded-2xl object-cover mb-10 shadow-lg"
                  style={{ maxHeight: '500px', ...getObjectPositionStyle(article.image_focal_point, false) }}
                />
              )}

              {article.video_url && <VideoEmbed url={article.video_url} />}

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.tags
                    .filter((tag: string) => {
                      const lowerTag = tag.toLowerCase();
                      return ['lakers', 'warriors', 'celtics', 'heat', 'bulls', 'knicks', 
                              'nets', 'cavaliers', 'mavericks', 'spurs', 'rockets', 'thunder', 
                              'bucks', 'suns', '76ers', 'hawks', 'magic', 'hornets', 'pistons',
                              'pacers', 'clippers', 'pelicans', 'timberwolves', 'trail-blazers',
                              'kings', 'raptors', 'jazz', 'wizards', 'grizzlies', 'nuggets'].includes(lowerTag);
                    })
                    .map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/times/${tag.toLowerCase()}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-900 px-4 py-2 rounded-full text-sm font-medium transition group font-inter"
                      >
                        🏀 <span className="group-hover:underline">Ver página do {tag}</span>
                      </Link>
                    ))
                  }
                </div>
              )}

              {renderBody()}
              
              {/* ✅ NOVO CTA DE MONETIZAÇÃO */}
              <AmazonCTA />

              {article.tags && article.tags.length > 0 && (
                <div className="pt-8 border-t border-gray-200 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 font-oswald">Tags:</h3>
                  <div className="flex flex-wrap gap-2 font-inter">
                    {article.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-4xl pb-12">
          <div className="mt-12 mb-12">
            <h2 className="font-bebas text-3xl text-gray-900 mb-6 pb-3 border-b-2 border-gray-200">
              📰 Últimas Notícias
            </h2>
            <LatestNews currentPostId={article.id} limit={3} />
          </div>
          <DisqusComments
            identifier={article.slug}
            title={article.title}
            url={`https://duo-dunk-blog.vercel.app/artigos/${article.slug}`}
          />
        </div>
      </div>
    </>
  );
}