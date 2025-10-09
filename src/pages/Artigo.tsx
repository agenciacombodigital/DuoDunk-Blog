import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

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
        .single();
      setArticle(data);
      setLoading(false);
    };
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-12 w-3/4 mb-4 bg-gray-900" />
        <Skeleton className="h-6 w-1/2 mb-8 bg-gray-900" />
        <Skeleton className="h-96 w-full mb-8 bg-gray-900" />
        <Skeleton className="h-4 w-full mb-4 bg-gray-900" />
        <Skeleton className="h-4 w-full mb-4 bg-gray-900" />
        <Skeleton className="h-4 w-5/6 mb-4 bg-gray-900" />
      </div>
    );
  }

  if (!article) {
    return <div className="text-center py-20">Artigo não encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <article className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>
        <p className="text-lg text-gray-400 mb-8">{article.summary}</p>
        <img src={article.image_url} alt={article.title} className="w-full rounded-lg mb-8" />
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </article>
    </div>
  );
}