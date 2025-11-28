"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Loader2, ArrowLeft, Search, Filter, X } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { getObjectPositionStyle } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import PageMeta from '@/components/PageMeta';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
  image_focal_point?: string;
}

const ARTICLES_PER_PAGE = 12;

export default function Ultimas() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  // Função de busca de artigos (memoizada)
  const loadArticles = useCallback(async (currentPage: number, currentSearchTerm: string, currentFilterTag: string | null) => {
    setLoading(true);
    setError(null);
    const offset = (currentPage - 1) * ARTICLES_PER_PAGE;

    let query = supabase
      .from('articles')
      .select('id, title, slug, summary, image_url, source, tags, published_at, image_focal_point')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + ARTICLES_PER_PAGE - 1);

    if (currentSearchTerm) {
      // Busca por título ou resumo
      query = query.or(`title.ilike.%${currentSearchTerm}%,summary.ilike.%${currentSearchTerm}%`);
    }
    
    if (currentFilterTag) {
      // Filtra por tag (usando contains para array de texto)
      query = query.contains('tags', [currentFilterTag]);
    }

    try {
      const { data, error } = await query;

      if (error) throw error;

      const newArticles = data || [];
      
      setArticles(prev => currentPage === 1 ? newArticles : [...prev, ...newArticles]);
      setHasMore(newArticles.length === ARTICLES_PER_PAGE);
      setPage(currentPage);
    } catch (error: any) {
      console.error('Erro ao carregar artigos:', error);
      setError('Falha ao carregar notícias. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega todas as tags disponíveis
  const loadAllTags = async () => {
    try {
      const { data } = await supabase
        .from('articles')
        .select('tags')
        .eq('published', true)
        .limit(100);
        
      if (data) {
        const tags = data.flatMap(item => item.tags || []).filter(tag => tag && tag.toLowerCase() !== 'nba');
        const uniqueTags = Array.from(new Set(tags)).sort();
        setAllTags(uniqueTags);
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  // Efeito para inicializar e recarregar dados ao mudar filtros/busca
  useEffect(() => {
    const initialSearch = searchParams.get('q') || '';
    setSearchTerm(initialSearch);
    loadAllTags();
  }, [searchParams]);

  useEffect(() => {
    // Recarrega a lista sempre que o termo de busca ou filtro mudar
    setPage(1);
    setArticles([]);
    setHasMore(true);
    loadArticles(1, searchTerm, filterTag);
  }, [searchTerm, filterTag, loadArticles]);


  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadArticles(page + 1, searchTerm, filterTag);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTagFilter = (tag: string) => {
    setFilterTag(tag === filterTag ? null : tag);
  };

  return (
    <div className="min-h-screen bg-white">
      <PageMeta 
        title="Últimas Notícias" 
        description="Acompanhe as últimas notícias e artigos sobre a NBA, atualizados em tempo real."
        canonicalPath="/ultimas"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-oswald text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Últimas Notícias
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            Todos os artigos e análises do DuoDunk em um só lugar.
          </p>
        </div>

        {/* Barra de Busca e Filtro */}
        <div className="max-w-4xl mx-auto mb-8 space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Buscar por título ou palavra-chave..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-1 bg-gray-100 border-gray-300 focus:border-pink-500 focus:ring-pink-500"
            />
            <Button 
              variant="outline" 
              className="bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => setSearchTerm('')}
              disabled={!searchTerm}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Filtro de Tags */}
          <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
            <Filter className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filterTag === tag
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {tag}
                {filterTag === tag && <X className="w-3 h-3 inline ml-1" />}
              </button>
            ))}
            {filterTag && !allTags.includes(filterTag) && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-600 text-white shadow-md">
                {filterTag}
              </span>
            )}
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="text-center py-10 text-red-600 bg-red-50 border border-red-200 rounded-xl max-w-4xl mx-auto mb-8">
            <p className="font-inter font-semibold">{error}</p>
          </div>
        )}

        {/* Lista de Artigos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} index={index} />
          ))}
        </div>

        {/* Loading e Botão Carregar Mais */}
        <div className="text-center mt-12">
          {loading && articles.length === 0 ? (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando...
            </div>
          ) : articles.length === 0 && !loading && !error ? (
            <p className="text-gray-600">Nenhum artigo encontrado com os filtros aplicados.</p>
          ) : hasMore && !loading ? (
            <Button 
              onClick={handleLoadMore} 
              className="btn-magenta px-8 py-3"
            >
              Carregar Mais Notícias
            </Button>
          ) : (
            !loading && articles.length > 0 && <p className="text-gray-500 text-sm">Fim da lista de notícias.</p>
          )}
        </div>
      </div>
    </div>
  );
}