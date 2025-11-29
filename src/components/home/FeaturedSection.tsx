import Link from 'next/link';
import { TrendingUp, Clock, Star } from 'lucide-react';
import { getObjectPositionStyle } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';
import { Article } from './ArticleTypes';

interface FeaturedSectionProps {
  featuredArticle: Article;
  section1: Article[];
}

// Helper function (copied from app/page.tsx)
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

export default function FeaturedSection({ featuredArticle, section1 }: FeaturedSectionProps) {
  const focalPointStyle = getObjectPositionStyle(featuredArticle.image_focal_point, false);
  const miniGridArticles = section1.slice(3, 6);
  const sidebarArticles = section1.slice(0, 3);
  const card5 = section1[6];

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="font-bebas text-2xl text-pink-600 mb-4 tracking-wide uppercase flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Em Destaque
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Card Principal */}
        <div className="lg:col-span-8 space-y-6">
          <Link href={`/artigos/${featuredArticle.slug}`} className="group block">
            <div className="relative w-full aspect-[3/4] md:aspect-video overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow">
              <img
                src={getOptimizedImageUrl(featuredArticle.image_url, 1200)}
                srcSet={`${getOptimizedImageUrl(featuredArticle.image_url, 400)} 400w, ${getOptimizedImageUrl(featuredArticle.image_url, 800)} 800w, ${getOptimizedImageUrl(featuredArticle.image_url, 1200)} 1200w`}
                sizes="(max-width: 1023px) 100vw, 800px"
                alt={featuredArticle.title}
                loading="eager"
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
                <h1 className="font-oswald text-2xl md:text-4xl font-bold uppercase tracking-wide mb-3 text-white group-hover:text-pink-400 transition line-clamp-3 md:line-clamp-2">
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

          {/* Grid 3 Cards Horizontais */}
          {miniGridArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {miniGridArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/artigos/${article.slug}`}
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
                    <h3 className="font-oswald text-sm md:text-base font-semibold uppercase text-gray-900 mb-2 group-hover:text-pink-600 transition line-clamp-2 leading-tight">
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
          )}
        </div>

        {/* Sidebar com Mini Cards Numerados 2, 3, 4 */}
        <div className="lg:col-span-4 space-y-4">
          {sidebarArticles.map((article, index) => (
            <Link
              key={article.id}
              href={`/artigos/${article.slug}`}
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
                <h3 className="font-oswald text-sm md:text-base font-semibold uppercase text-gray-900 group-hover:text-pink-600 transition line-clamp-3 leading-tight">
                  {article.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-inter">
                  <Clock className="w-3 h-3" />
                  <span>Há {getTimeAgo(article.published_at)}</span>
                </div>
              </div>
            </Link>
          ))}

          {/* Card #5 */}
          {card5 && (
            <Link
              href={`/artigos/${card5.slug}`}
              className="group block bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={getOptimizedImageUrl(card5.image_url, 400)}
                  alt={card5.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={getObjectPositionStyle(card5.image_focal_point)}
                />
              </div>
              <div className="p-4">
                <span className="font-bebas text-lg inline-block bg-pink-600 text-white px-3 py-1 rounded-full mb-2">
                  5
                </span>
                <h3 className="font-oswald text-lg md:text-xl font-semibold uppercase text-gray-900 mb-2 group-hover:text-pink-600 transition line-clamp-2">
                  {card5.title}
                </h3>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}