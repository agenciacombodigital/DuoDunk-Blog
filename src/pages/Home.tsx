import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Loader2, Clock, Eye } from 'lucide-react';

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
  // Priorizar notícias marcadas como destaque
  const featuredArticle = articles.find(a => a.is_featured) || articles[0];
  // Filtrar o artigo em destaque das outras seções
  const section1 = articles
    .filter(a => a.id !== featuredArticle?.id)
    .slice(0, 7); // 7 notícias: 3 direita + 3 abaixo + 1 grande
  const section2 = articles.slice(8, 14); // Lista horizontal
  const section3 = articles.slice(14, 16); // Grid 2 colunas
  const section4 = articles.slice(16, 20); // Grid 4 colunas
  const section5 = articles.slice(20, 26); // Layout alternado
  const section6 = articles.slice(26, 29); // Grid 3 colunas
  const section7 = articles.slice(29, 35); // Lista horizontal
  const section8 = articles.slice(35, 37); // Grid 2 colunas
  const remaining = articles.slice(37); // Resto

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Layout Exato do Print */}
      {featuredArticle && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-sm font-bold text-pink-600 mb-4 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            EM DESTAQUE
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ESQUERDA: Notícia em Destaque Retangular */}
            <div className="lg:col-span-8 space-y-6">
              {/* Notícia Principal */}
              <Link 
                to={`/artigos/${featuredArticle.slug}`}
                className="group relative block rounded-2xl overflow-hidden h-[400px] shadow-xl hover:shadow-2xl transition-shadow"
              >
                <img
                  src={featuredArticle.image_url}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {featuredArticle.views || 0} views
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
              </Link>

              {/* 3 Notícias Abaixo (Grid 3 Colunas) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {section1.slice(3, 6).map((article) => (
                  <Link
                    key={article.id}
                    to={`/artigos/${article.slug}`}
                    className="group bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                  >
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-40 object-cover"
                    />
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

            {/* DIREITA: 3 Notícias Verticais + 1 Grande */}
            <div className="lg:col-span-4 space-y-4">
              {/* 3 Cards Pequenos */}
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

              {/* Card Grande no Final */}
              {section1[6] && (
                <Link
                  to={`/artigos/${section1[6].slug}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                >
                  <img
                    src={section1[6].image_url}
                    alt={section1[6].title}
                    className="w-full h-48 object-cover"
                  />
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