import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface LatestNewsProps {
  currentPostId: string;
  limit?: number;
}

export default function LatestNews({ currentPostId, limit = 3 }: LatestNewsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestNews();
  }, [currentPostId, limit]);

  const loadLatestNews = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, image_url, published_at')
        .eq('published', true)
        .neq('id', currentPostId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || posts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/artigos/${post.slug}`}
          className="group bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-pink-500 hover:shadow-lg transition-all"
        >
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="p-4">
            <h3 className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(post.published_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}