import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Article } from './ArticleTypes';

interface ListSectionProps {
  title: string;
  articles: Article[];
  icon: 'pin' | 'fire' | 'chart' | 'ball';
  isAlternating?: boolean;
  isBoxed?: boolean;
}

const iconMap = {
  pin: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">📌</span>,
  fire: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">🔥</span>,
  chart: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">📊</span>,
  ball: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">🏀</span>,
};

export default function ListSection({ title, articles, icon, isAlternating = false, isBoxed = false }: ListSectionProps) {
  if (articles.length === 0) return null;

  const containerClasses = isBoxed 
    ? "bg-gray-50 rounded-xl p-4 md:p-8 border border-gray-100" 
    : "";

  return (
    <section className={containerClasses}>
      <h2 className="font-bebas text-3xl md:text-5xl mb-4 md:mb-6 flex items-center gap-2">
        {iconMap[icon]} {title}
      </h2>
      <div className="space-y-4">
        {articles.map((article, index) => {
          const isReversed = isAlternating && index % 2 !== 0;
          
          return (
            <Link
              key={article.id}
              href={`/artigos/${article.slug}`}
              className={`group flex flex-col md:flex-row gap-6 bg-white rounded-xl overflow-hidden hover:bg-gray-100 transition duration-300 ${
                isAlternating ? (isReversed ? 'md:flex-row-reverse' : 'md:flex-row') : 'md:flex-row'
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
                <h3 className="font-oswald text-sm md:text-lg font-bold uppercase mb-3 group-hover:text-pink-400 transition line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 font-inter">{article.summary}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-inter">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}