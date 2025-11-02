import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Loader2, Clock, Eye, Star } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';

// Função para calcular tempo atrás
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'menos de 1h';
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1 dia';
  if (diffInDays < 7) return `${diffInDays} dias`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      // Buscamos 100 artigos para preencher as seções
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400 text-lg">Nenhum artigo publicado ainda.</p>
      </div>
    );
  }

  // Separar artigos por seções
  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  const section1 = articles
    .filter(a => a.id !== featuredArticle?.id)
    .slice(0, 7);
  const section2 = articles.slice(8, 14);
  const section3 = articles.slice(14, 16);
  const section4 = articles.slice(16, 20);
  const section5 = articles.slice(20, 26);
  const section6 = articles.slice(26, 29);
  const section7 = articles.slice(29, 35);
  const section8 = articles.slice(35, 37);
  const remaining = articles.slice(37);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {featuredArticle && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-sm font-bold text-pink-600 mb-4 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            EM DESTAQUE
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Link 
                to={`/artigos/${featuredArticle.slug}`}
                className="group block"
              >
                <div className="relative w-full aspect-[4/3] lg:aspect-[16/9] overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                  <img
                    src={featuredArticle.image_url}
                    alt={featuredArticle.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={getObjectPositionStyle(featuredArticle.image_focal_point)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        DESTAQUE
                      </span>
                      <span className="text-white/80 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Há {getTimeAgo(featuredArticle.published_at)}
                      </span>
                    </div>
                    
                    <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-white group-hover:text-pink-400 transition line-clamp-2">
                      {featuredArticle.title}
                    </h1>
                    
                    <p className="text-lg text-white/90 line-clamp-2 mb-3">
                      {featuredArticle.summary}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <span className="font-medium">{featuredArticle.source}</span>
                      <span>•</span>
                      <span>{new Date(featuredArticle.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {section1.slice(3, 6).map((article) => (
                  <Link
                    key={article.id}
                    to={`/artigos/${article.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-pink-600 transition line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>há {getTimeAgo(article.published_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              {section1.slice(0, 3).map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group flex gap-3 bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition h-[120px]"
                >
                  <div className="relative w-2/5 flex-shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                    <span className="absolute top-2 left-2 bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 2}
                    </span>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-pink-600 transition line-clamp-3">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Há {getTimeAgo(article.published_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {section1[6] && (
                <Link
                  to={`/artigos/${section1[6].slug}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={section1[6].image_url}
                      alt={section1[6].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(section1[6].image_focal_point)}
                    />
                  </div>
                  <div className="p-4">
                    <span className="inline-block bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                      5
                    </span>
                    <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-pink-600 transition line-clamp-2">
                      {section1[6].title}
                    </h3>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 space-y-16">
        {section2.length > 0 && (
          <section className="bg-gray-50 rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">📰 Notícias em Destaque</h2>
            <div className="space-y-4">
              {section2.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="flex flex-col md:flex-row gap-4 group hover:bg-gray-100 p-4 rounded-lg transition"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full md:w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 hidden md:block">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section3.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">🔥 Análises Profundas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section3.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section4.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">⚡ Destaques Rápidos</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {section4.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section5.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">📊 Mais Lidas</h2>
            <div className="space-y-6">
              {section5.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className={`group flex flex-col md:flex-row gap-6 bg-gray-50 rounded-xl overflow-hidden hover:bg-gray-100 transition duration-300 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full md:w-1/3 h-48 object-cover flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section6.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">🏀 Mais da NBA</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section6.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section7.length > 0 && (
          <section className="bg-gray-50 rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">📌 Não Perca</h2>
            <div className="space-y-4">
              {section7.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="flex flex-col md:flex-row gap-4 group hover:bg-gray-100 p-4 rounded-lg transition"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full md:w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 hidden md:block">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section8.length > 0 && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section8.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3">{article.summary}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {remaining.length > 0 && (
          <section className="mt-20">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-black text-black">📚 ARQUIVO</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-500 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remaining.map((article, index) => {
                const layoutType = index % 6;

                if (layoutType === 0 || layoutType === 3) {
                  return (
                    <div key={article.id} className="md:col-span-2 group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-2/5 relative">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-56 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={getObjectPositionStyle(article.image_focal_point)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-bold text-pink-500 uppercase">
                                {article.tags?.[0] || 'NBA'}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-400">
                                {new Date(article.published_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-500 transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-3">{article.summary}</p>
                          </div>
                          
                          <Link
                            to={`/artigos/${article.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link"
                          >
                            Ler mais
                            <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (layoutType === 2 || layoutType === 5) {
                  return (
                    <div key={article.id} className="md:col-span-2 lg:col-span-3 group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="grid lg:grid-cols-2">
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={getObjectPositionStyle(article.image_focal_point)}
                          />
                        </div>
                        <div className="flex flex-col justify-center p-8">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {article.tags?.[0] || 'NBA'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(article.published_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight group-hover:text-pink-600 transition-colors">
                            {article.title}
                          </h3>
                          {article.subtitle && (
                            <p className="text-lg text-gray-700 mb-4">{article.subtitle}</p>
                          )}
                          <p className="text-sm text-gray-600 mb-6 line-clamp-4">{article.summary}</p>
                          
                          <Link
                            to={`/artigos/${article.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link w-fit"
                          >
                            Ler Matéria Completa
                            <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={article.id} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                          {article.tags?.[0] || 'NBA'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-pink-500 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">{article.summary}</p>
                      
                      <Link
                        to={`/artigos/${article.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 group/link"
                      >
                        Leia mais
                        <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {remaining.length >= 20 && (
              <div className="text-center mt-12">
                <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-8 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  Carregar Mais Artigos
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}