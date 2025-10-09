import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(12);
      
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Hero Section - Mantém Preta */}
      <section className="hero-section min-h-[60vh] flex items-center justify-center relative overflow-hidden">
        {/* Ícone de basquete animado */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <svg 
            className="w-64 h-64 text-cyan-400" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto fade-in">
          {/* Ícone menor acima do título */}
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#FA007D]/20 to-[#00DBFB]/20 rounded-full border border-gray-700">
            <svg className="w-12 h-12 text-[#00DBFB]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            O JOGO DENTRO DO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FA007D] to-[#00DBFB]">
              JOGO.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Notícias, análises e tudo sobre o universo da NBA com o poder da IA.
          </p>
          
          <Link to="/ultimas" className="btn-magenta inline-flex items-center gap-2">
            Explorar Notícias
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Últimas Notícias - Fundo Branco */}
      <section className="content-area py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900">
              Últimas Notícias
            </h2>
            <Link 
              to="/ultimas" 
              className="text-[#FA007D] hover:text-[#00DBFB] transition-colors font-semibold inline-flex items-center gap-2"
            >
              Ver Todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#FA007D] mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando artigos...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <p className="text-gray-500 text-lg mb-2">
                Nenhum artigo publicado ainda.
              </p>
              <p className="text-sm text-gray-400">
                Aprove artigos no painel admin para publicá-los aqui!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="article-card group fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Imagem */}
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Badge da fonte */}
                    <div className="absolute top-3 left-3">
                      <span className="tag-cyan">
                        {article.source}
                      </span>
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#FA007D] transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                    
                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span 
                            key={tag} 
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <span>
                        {new Date(article.published_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-[#00DBFB] group-hover:text-[#FA007D] font-semibold transition-colors">
                        Ler mais →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}