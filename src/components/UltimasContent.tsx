"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Filter, X } from 'lucide-react';
import ArticleCard from '@/components/ArticleCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

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

export default function UltimasContent() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Função de busca de artigos (memoizada)
  const fetchArticles = useCallback(async (pageNumber: number, isNewSearch: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (selectedTag) {
        query = query.contains('tags', [selectedTag]);
      }

      const from = (pageNumber - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;

      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      if (isNewSearch) {
        setArticles(data || []);
      } else {
        setArticles(prev => [...prev, ...(data || [])]);
      }

      if (count !== null) {
        setHasMore(from + (data?.length || 0) < count);
      }
    } catch (err: any) {
      console.error('Erro ao buscar artigos:', err);
      setError('Não foi possível carregar as notícias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedTag]);
  
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

  useEffect(() => {
    const tagParam = searchParams.get('tag');
    if (tagParam) {
      setSelectedTag(tagParam);
    }
    loadAllTags();
  }, [searchParams]);

  useEffect(() => {
    // Recarrega a lista sempre que o termo de busca ou filtro mudar
    setPage(1);
    setArticles([]);
    setHasMore(true);
    fetchArticles(1, true);
  }, [searchTerm, selectedTag, fetchArticles]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchArticles(page + 1, false);
      setPage(prev => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // O useEffect já dispara a busca ao mudar o searchTerm
    setPage(1);
    setArticles([]);
    setHasMore(true);
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTag(null);
    setPage(1);
    // A busca será disparada pelo useEffect
  };

  return (
    <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
             <h1 className="text-4xl sm:text-5xl font-black text-gray-900 font-oswald mb-4">Últimas Notícias</h1>
             
             {/* Filtros e Busca */}
             <div className="max-w-4xl mx-auto mb-8 space-y-4">
                <div className="flex gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar notícias..." 
                                className="pl-9 font-inter bg-gray-100 border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                            />
                        </div>
                        <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                            Buscar
                        </Button>
                    </form>
                    
                    {(searchTerm || selectedTag) && (
                        <Button variant="outline" onClick={clearFilters} className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                            <X className="w-4 h-4" /> Limpar
                        </Button>
                    )}
                </div>
                
                {/* Filtro de Tags */}
                <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                    {allTags.slice(0, 10).map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagFilter(tag)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                selectedTag === tag
                                    ? 'bg-pink-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                            {tag}
                            {selectedTag === tag && <X className="w-3 h-3 inline ml-1" />}
                        </button>
                    ))}
                    {selectedTag && !allTags.includes(selectedTag) && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-600 text-white shadow-md">
                            {selectedTag}
                        </span>
                    )}
                </div>
             </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="text-center py-10 text-red-600 bg-red-50 border border-red-200 rounded-xl max-w-4xl mx-auto mb-8">
              <p className="font-inter font-semibold">{error}</p>
            </div>
          )}

          {/* Grid de Artigos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article, index) => (
              <ArticleCard key={article.id} article={article} index={index} />
            ))}
          </div>

          {/* Loading e Botão Mais */}
          <div className="mt-12 text-center">
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