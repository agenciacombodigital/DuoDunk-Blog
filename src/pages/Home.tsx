import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Loader2 } from 'lucide-react';

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
  const featuredArticle = articles[0];
  const section1 = articles.slice(1, 4); // Grid 3 colunas (3 itens)
  const section2 = articles.slice(4, 10); // Lista horizontal (6 itens)
  const section3 = articles.slice(10, 12); // Grid 2 colunas grandes (2 itens)
  const section4 = articles.slice(12, 16); // Grid 4 colunas (4 itens)
  const section5 = articles.slice(16, 22); // Layout alternado (6 itens)
  const section6 = articles.slice(22, 25); // Grid 3 colunas (3 itens)
  const section7 = articles.slice(25, 31); // Lista horizontal (6 itens)
  const section8 = articles.slice(31, 33); // Grid 2 colunas (2 itens)
  
  // Novas seções
  const section9 = articles.slice(33, 39);
  const section10 = articles.slice(39, 43);
  const section11 = articles.slice(43, 49);

  // Resto em grid 3 colunas
  const remaining = articles.slice(49); 

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero - Artigo em Destaque */}
      {featuredArticle && (
        <section className="relative h-[600px] mb-12">
          <div className="absolute inset-0">
            <img
              src={featuredArticle.image_url}
              alt={featuredArticle.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </div>

          <div className="container mx-auto px-4 h-full flex items-end pb-12 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  EM DESTAQUE
                </span>
              </div>
              <Link to={`/artigos/${featuredArticle.slug}`}>
                <h1 className="text-5xl font-bold mb-4 hover:text-pink-400 transition leading-tight text-white">
                  {featuredArticle.title}
                </h1>
              </Link>
              <p className="text-xl text-gray-300 mb-6 line-clamp-3">{featuredArticle.summary}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{featuredArticle.source}</span>
                <span>•</span>
                <span>{new Date(featuredArticle.published_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 space-y-16">
        {/* SEÇÃO 1: Grid 3 Colunas */}
        {section1.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-400" />
              Últimas Notícias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {section1.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/artigos/${article.slug}`}
                  className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
                >
                  <div className="relative">
                    <span className="absolute top-4 left-4 bg-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg z-10">
                      {index + 2}
                    </span>
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover"
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