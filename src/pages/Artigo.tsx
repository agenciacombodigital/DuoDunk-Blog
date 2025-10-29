import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock } from 'lucide-react';
import NewsSidebar from '@/components/NewsSidebar';
import DisqusComments from '@/components/DisqusComments';
import VideoEmbed from '@/components/VideoEmbed';

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Artigo não encontrado
          </h1>
          <Link 
            to="/" 
            className="text-[#00DBFB] hover:text-[#FA007D] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-16">
          <article className="lg:col-span-2">
            {/* Botão Voltar */}
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FA007D] transition-colors mb-8 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap">
              <span className="tag-cyan">
                {article.source}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(article.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Resumo */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {article.summary}
            </p>

            {/* Imagem de Destaque (Hero) */}
            {article.image_url && (
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-auto rounded-2xl mb-10 shadow-lg"
              />
            )}

            {/* Vídeo Embed (se existir) */}
            {article.video_url && (
              <VideoEmbed url={article.video_url} />
            )}

            {/* Links para times mencionados nas tags */}
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
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 text-pink-900 px-4 py-2 rounded-full text-sm font-medium transition group"
                    >
                      🏀 <span className="group-hover:underline">Ver página do {tag}</span>
                    </Link>
                  ))
                }
              </div>
            )}

            {/* Corpo do Artigo */}
            <div 
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="pt-8 border-t border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags:</h3>
                <div className="flex flex-wrap gap-2">
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
          
          <aside className="lg:col-span-1">
            <NewsSidebar />
          </aside>
        </div>
      </div>

      {/* Sistema de Comentários */}
      <div className="container mx-auto px-4 max-w-4xl pb-12">
        <DisqusComments
          identifier={article.slug}
          title={article.title}
          url={`https://duo-dunk-blog.vercel.app/artigos/${article.slug}`}
        />
      </div>
    </div>
  );
}