import Link from 'next/link';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Article } from './ArticleTypes';
import { Flame, Zap, BasketballIcon } from 'lucide-react';

interface NewsGridSectionProps {
  title?: string;
  articles: Article[];
  icon?: 'fire' | 'zap' | 'ball';
  gridCols: 2 | 3 | 4;
  aspectRatio: '16/9' | '4/3';
  titleSize: 'sm' | 'md' | 'lg';
  showSummary?: boolean;
}

const iconMap = {
  fire: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">🔥</span>,
  zap: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">⚡</span>,
  ball: <span className="font-bebas text-3xl md:text-5xl flex items-center gap-2">🏀</span>,
};

const titleSizeMap = {
  sm: 'text-xs md:text-sm',
  md: 'text-sm md:text-lg',
  lg: 'text-xl md:text-2xl',
};

export default function NewsGridSection({ 
  title, 
  articles, 
  icon, 
  gridCols, 
  aspectRatio, 
  titleSize,
  showSummary = false
}: NewsGridSectionProps) {
  if (articles.length === 0) return null;

  const gridClass = `grid-cols-1 md:grid-cols-${gridCols}`;
  const aspectClass = aspectRatio === '16/9' ? 'aspect-[16/9]' : 'aspect-[4/3]';

  return (
    <section>
      {title && (
        <h2 className="font-bebas text-3xl md:text-5xl mb-4 md:mb-6 flex items-center gap-2">
          {icon ? iconMap[icon] : null} {title}
        </h2>
      )}
      <div className={`grid ${gridClass} gap-3 md:gap-6`}>
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/artigos/${article.slug}`}
            className="group bg-gray-50 rounded-xl overflow-hidden hover:transform hover:scale-[1.02] transition duration-300"
          >
            <div className={`${aspectClass} overflow-hidden`}>
              <img
                src={getOptimizedImageUrl(article.image_url, 600)}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={getObjectPositionStyle(article.image_focal_point)}
              />
            </div>
            <div className="p-4 md:p-6">
              <h3 className={`font-oswald ${titleSizeMap[titleSize]} font-bold uppercase mb-3 group-hover:text-pink-400 transition line-clamp-2 leading-tight`}>
                {article.title}
              </h3>
              {showSummary && (
                <p className="text-gray-600 line-clamp-2 font-inter text-sm">{article.summary}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 font-inter mt-2">
                <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}