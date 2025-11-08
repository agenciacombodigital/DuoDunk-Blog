import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Loader2, Clock, Star } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { useIsMobile } from '@/hooks/use-mobile';

// Função auxiliar para mostrar o tempo "há X horas/dias"
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
  const isMobile = useIsMobile();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
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
        <p className="text-gray-400 text-lg font-inter">Nenhum artigo publicado ainda.</p>
      </div>
    );
  }

  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  const section1 = articles.filter(a => a.id !== featuredArticle?.id).slice(0, 7);
  const section2 = articles.slice(8, 14);
  const section3 = articles.slice(14, 16);
  const section4 = articles.slice(16, 20);
  const section5 = articles.slice(20, 26);
  const section6 = articles.slice(26, 29);
  const section7 = articles.slice(29, 35);
  const section8 = articles.slice(35, 37);
  const remaining = articles.slice(37);

  // ✅ CORREÇÃO: Determina o focal point correto baseado no dispositivo
  const focalPointValue = isMobile 
    ? featuredArticle.image_focal_point_mobile
    : featuredArticle.image_focal_point;
    
  // ✅ CORREÇÃO: Passa o flag correto para a função
  const focalPointStyle = getObjectPositionStyle(focalPointValue, isMobile);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {featuredArticle && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="font-bebas text-2xl text-pink-600 mb-4 tracking-wide uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Em Destaque
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <Link to={`/artigos/${featuredArticle.slug}`} className="group block">
                {/* ✅ CORREÇÃO PRINCIPAL: Estrutura simplificada sem DIV interno desnecessário */}
                <div className="relative w-full aspect-3/4 md:aspect-video overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
                  
                  <img
                    src={getOptimizedImageUrl(featuredArticle.image_url, 1200)}
                    srcSet={`
                      ${getOptimizedImageUrl(featuredArticle.image_url, 400)} 400w,
                      ${getOptimizedImageUrl(featuredArticle.image_url, 800)} 800w,
                      ${getOptimizedImageUrl(featuredArticle.image_url, 1200)} 1200w
                    `}
                    sizes="(max-width: 1023px) 100vw, 800px"
                    alt={featuredArticle.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={focalPointStyle}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-inter font-semibold uppercase flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        DESTAQUE
                      </span>
                      <span className="text-white/80 text-sm font-inter flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Há {getTimeAgo(featuredArticle.published_at)}
                      </span>
                    </div>

                    <h1 className="font-oswald text-4xl md:text-5xl font-bold uppercase tracking-wide mb-3 text-white group-hover:text-pink-400 transition line-clamp-3 md:line-clamp-2">
                      {featuredArticle.title}
                    </h1>

                    <div className="flex items-center gap-2 text-sm text-white/70 font-inter">
                      <span>
                        {new Date(featuredArticle.published_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
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
                        src={getOptimizedImageUrl(article.image_url, 400)}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-oswald text-lg md:text-xl font-semibold uppercase text-gray-900 mb-2 group-hover:text-pink-600 transition line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-inter">
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
                      src={getOptimizedImageUrl(article.image_url, 200)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                    <span className="absolute top-2 left-2 font-bebas text-lg bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 2}
                    </span>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    {/* AJUSTE 3: Mini Cards Laterais (2, 3, 4) - Reduzido para text-xs md:text-sm */}
                    <h3 className="font-oswald text-xs md:text-sm font-semibold uppercase text-gray-900 group-hover:text-pink-600 transition line-clamp-3">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-inter">
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
                      src={getOptimizedImageUrl(section1[6].image_url, 400)}
                      alt={section1[6].title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(section1[6].image_focal_point)}
                    />
                  </div>
                  <div className="p-4">
                    <span className="font-bebas text-lg inline-block bg-pink-600 text-white px-3 py-1 rounded-full mb-2">
                      5
                    </span>
                    <h3 className="font-oswald text-lg md:text-xl font-semibold uppercase text-gray-900 mb-2 group-hover:text-pink-600 transition line-clamp-2">
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
          <section className="bg-gray-50 rounded-xl p-4 md:p-8 border border-gray-100">
            <h2 className="font-bebas text-2xl md:text-4xl mb-4 md:mb-6 flex items-center gap-2">
              📌 Não Perca
            </h2>
            <div className="space-y-4">
              {section2.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="flex flex-col md:flex-row gap-4 group hover:bg-gray-100 p-4 rounded-lg transition"
                >
                  <img
                    src={getOptimizedImageUrl(article.image_url, 200)}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full md:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1">
                    {/* AJUSTE 2: Seção Não Perca (section2) - Reduzido para text-sm md:text-base */}
                    <h3 className="font-oswald text-sm md:text-base font-bold uppercase mb-2 group-hover:text-pink-400 transition line-clamp-2 leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 hidden md:block font-inter">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-inter">
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
            <h2 className="font-bebas text-4xl mb-6">🔥 Análises Profundas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section3.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(article.image_url, 600)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-oswald text-xl md:text-2xl font-bold uppercase mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 font-inter">{article.summary}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-inter">
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
            <h2 className="font-bebas text-2xl md:text-4xl mb-4 md:mb-6 flex items-center gap-2">
              ⚡ Destaques Rápidos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {section4.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(article.image_url, 300)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-2.5 md:p-3">
                    {/* AJUSTE 1: Seção Destaques Rápidos (section4) - Reduzido para text-xs */}
                    <h3 className="font-oswald text-xs font-semibold uppercase group-hover:text-pink-400 transition line-clamp-3 leading-tight">
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
            <h2 className="font-bebas text-4xl mb-6">📊 Mais Lidas</h2>
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
                    src={getOptimizedImageUrl(article.image_url, 400)}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full md:w-1/3 h-48 object-cover flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <h3 className="font-oswald text-lg md:text-xl font-bold uppercase mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 font-inter">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section6.length > 0 && (
          <section>
            <h2 className="font-bebas text-4xl mb-6">🏀 Mais da NBA</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section6.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(article.image_url, 400)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-oswald text-lg md:text-xl font-bold uppercase mb-2 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 font-inter">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {section7.length > 0 && (
          <section className="bg-gray-50 rounded-xl p-8 border border-gray-100">
            <h2 className="font-bebas text-4xl mb-6">📌 Não Perca</h2>
            <div className="space-y-4">
              {section7.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="flex flex-col md:flex-row gap-4 group hover:bg-gray-100 p-4 rounded-lg transition"
                >
                  <img
                    src={getOptimizedImageUrl(article.image_url, 200)}
                    alt={article.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full md:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                    style={getObjectPositionStyle(article.image_focal_point)}
                  />
                  <div className="flex-1">
                    {/* AJUSTE 2: Seção Não Perca (section7) - Reduzido para text-sm md:text-base */}
                    <h3 className="font-oswald text-sm md:text-base font-bold uppercase mb-2 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 hidden md:block font-inter">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-inter">
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
                      src={getOptimizedImageUrl(article.image_url, 600)}
                      alt={article.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getObjectPositionStyle(article.image_focal_point)}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-oswald text-xl md:text-2xl font-bold uppercase mb-3 group-hover:text-pink-400 transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2 font-inter">{article.summary}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-inter">
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
              <h2 className="font-bebas text-5xl text-black">📚 ARQUIVO</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-500 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remaining.map((article, index) => {
                if (!article) return null;
                const layoutType = index % 6;

                if (layoutType === 0 || layoutType === 3) {
                  return (
                    <div key={article.id} className="md:col-span-2 group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-2/5 relative">
                          <img
                            src={getOptimizedImageUrl(article.image_url, 400)}
                            alt={article.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-56 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={getObjectPositionStyle(article.image_focal_point)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        </div>
                        <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-3 font-inter">
                              <span className="text-xs font-bold text-pink-500 uppercase">
                                {article.tags?.[0] || 'NBA'}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-400">
                                {new Date(article.published_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <h3 className="font-oswald text-lg md:text-xl font-bold uppercase text-gray-900 mb-3 group-hover:text-pink-500 transition-colors line-clamp-2">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 font-inter">{article.summary}</p>
                          </div>
                          
                          <Link
                            to={`/artigos/${article.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link font-inter"
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
                            src={getOptimizedImageUrl(article.image_url, 600)}
                            alt={article.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            style={getObjectPositionStyle(article.image_focal_point)}
                          />
                        </div>
                        <div className="flex flex-col justify-center p-8">
                          <div className="flex items-center gap-2 mb-4 font-inter">
                            <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {article.tags?.[0] || 'NBA'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(article.published_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h3 className="font-oswald text-2xl md:text-3xl font-black uppercase text-gray-900 mb-4 leading-tight group-hover:text-pink-600 transition-colors">
                            {article.title}
                          </h3>
                          {article.subtitle && (
                            <p className="text-lg text-gray-700 mb-4 font-inter">{article.subtitle}</p>
                          )}
                          <p className="text-sm text-gray-600 mb-6 line-clamp-2 font-inter">{article.summary}</p>
                          
                          <Link
                            to={`/artigos/${article.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link w-fit font-inter"
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
                        src={getOptimizedImageUrl(article.image_url, 400)}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase font-inter">
                          {article.tags?.[0] || 'NBA'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 font-inter">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h3 className="font-oswald text-lg md:text-xl font-bold uppercase text-gray-900 mb-3 line-clamp-2 group-hover:text-pink-500 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-inter">{article.summary}</p>
                      
                      <Link
                        to={`/artigos/${article.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 group/link font-inter"
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
          </section>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}