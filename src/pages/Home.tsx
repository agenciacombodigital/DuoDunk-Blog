import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Loader2, Clock } from 'lucide-react';

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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
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
  const featuredArticle = articles[0];
  const section1 = articles.slice(1, 7); // Para o novo grid (6 artigos)
  const section2 = articles.slice(7, 13);
  const section3 = articles.slice(13, 15);
  const section4 = articles.slice(15, 19);
  const section5 = articles.slice(19, 25);
  const section6 = articles.slice(25, 28);
  const section7 = articles.slice(28, 34);
  const section8 = articles.slice(34, 36);
  const section9 = articles.slice(36, 42);
  const section10 = articles.slice(42, 46);
  const section11 = articles.slice(46, 52);
  const remaining = articles.slice(52);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Layout Grid Completo */}
      {featuredArticle && section1.length >= 3 && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda: Notícia em Destaque */}
            <div className="lg:col-span-2 lg:row-span-2">
              <Link
                to={`/artigos/${featuredArticle.slug}`}
                className="group relative block h-full min-h-[600px] rounded-xl overflow-hidden"
              >
                <img
                  src={featuredArticle.image_url}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      EM DESTAQUE
                    </span>
                    <span className="text-white/80 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Há {getTimeAgo(featuredArticle.published_at)}
                    </span>
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white group-hover:text-pink-400 transition line-clamp-3">
                    {featuredArticle.title}
                  </h1>

                  <p className="text-xl text-white/90 line-clamp-2 mb-4">
                    {featuredArticle.summary}
                  </p>

                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="font-medium">{featuredArticle.source}</span>
                    <span>•</span>
                    <span>{new Date(featuredArticle.published_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Coluna Direita: 3 Notícias ao Lado */}
            <div className="flex flex-col gap-6">
              {section1.slice(0, 3).map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group relative bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition h-[180px]"
                >
                  <div className="flex h-full">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-1/3 object-cover"
                    />
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-pink-600 text-white rounded-full text-sm font-bold mb-2">
                          {index + 2}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-pink-600 transition line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Há {getTimeAgo(article.published_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Linha Inferior: 3 Notícias Abaixo */}
            {section1.slice(3, 6).length > 0 && (
              <>
                {section1.slice(3, 6).map((article) => (
                  <Link
                    key={article.id}
                    to={`/artigos/${article.slug}`}
                    className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition"
                  >
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-pink-600 transition line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {article.summary}
                      </p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 space-y-16">
        {/* SEÇÃO 2: Lista Horizontal */}
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

        {/* SEÇÃO 3: Grid 2 Colunas Grandes */}
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
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
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

        {/* SEÇÃO 4: Grid 4 Colunas Compactas */}
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
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-32 object-cover"
                  />
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

        {/* SEÇÃO 5: Layout Alternado (Zebra) */}
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

        {/* SEÇÃO 6: Grid 3 Colunas (Repetição) */}
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
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
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

        {/* SEÇÃO 7: Lista Horizontal (Repetição) */}
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

        {/* SEÇÃO 8: Grid 2 Colunas (Repetição) */}
        {section8.length > 0 && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {section8.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
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

        {/* SEÇÃO 9: Lista Horizontal (Repetição) */}
        {section9.length > 0 && (
          <section className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">🎯 Recomendados</h2>
            <div className="space-y-4">
              {section9.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="flex gap-4 group hover:bg-gray-100 p-4 rounded-lg transition"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition line-clamp-1">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO 10: Grid 4 Colunas */}
        {section10.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">⭐ Populares</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {section10.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-lg overflow-hidden hover:transform hover:scale-105 transition"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-32 object-cover"
                  />
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

        {/* SEÇÃO 11: Layout Alternado */}
        {section11.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">📌 Você Pode Gostar</h2>
            <div className="space-y-6">
              {section11.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className={`group flex gap-6 bg-gray-50 rounded-xl overflow-hidden hover:bg-gray-100 transition ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full md:w-1/3 h-48 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-pink-400 transition">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-2">{article.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Artigos Restantes: Grid 3 Colunas */}
        {remaining.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">📚 Arquivo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {remaining.map((article) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
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
      </div>

      {/* Espaçamento final */}
      <div className="h-20" />
    </div>
  );
}