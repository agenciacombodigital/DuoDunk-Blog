import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock } from 'lucide-react';
import DisqusComments from '@/components/DisqusComments';
import VideoEmbed from '@/components/VideoEmbed';
import LatestNews from '@/components/LatestNews';
import { getObjectPositionStyle } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import ArticleMeta from '@/components/ArticleMeta';

export default function Artigo() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (data) {
        setArticle(data);
        
        // Incrementar views
        await supabase
          .from('articles')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', data.id);
      }
      
      setLoading(false);
    };
    
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FA007D]"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-oswald">
            Artigo não encontrado
          </h1>
          <Link 
            to="/" 
            className="text-[#00DBFB] hover:text-[#FA007D] transition-colors inline-flex items-center gap-2 font-inter"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <>
      <ArticleMeta
        title={article.title}
        description={article.meta_description || article.summary}
        imageUrl={article.image_url}
        publishedAt={article.published_at}
        author={article.source || "Duo Dunk"}
        slug={article.slug}
        tags={article.tags || []}
      />
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <article>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FA007D] transition-colors mb-8 font-semibold font-inter"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap font-inter">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(article.published_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* AJUSTE DE TAMANHO: Título reduzido para text-3xl no mobile */}
              <h1 className="font-oswald text-3xl md:text-6xl font-bold uppercase text-gray-900 mb-6 leading-tight tracking-wide">
                {article.title}
              </h1>

              {/* AJUSTE DE TAMANHO: Resumo reduzido para text-lg no mobile */}
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-inter">
                {article.summary}
              </p>

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
                        to={`/times/${tag.toLowerCase()}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-900 px-4 py-2 rounded-full text-sm font-medium transition group font-inter"
                      >
                        🏀 <span className="group-hover:underline">Ver página do {tag}</span>
                      </Link>
                    ))
                  }
                </div>
              )}

              {renderBody()}

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