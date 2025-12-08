import Link from 'next/link';
import Image from 'next/image'; // Importando Image
import { getObjectPositionStyle } from '@/lib/utils';
import { Article } from './ArticleTypes';

interface ArchiveSectionProps {
  articles: Article[];
}

export default function ArchiveSection({ articles }: ArchiveSectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-bebas text-5xl text-black">📚 ARQUIVO</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-pink-500 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => {
          if (!article) return null;

          const layoutType = index % 6;
          
          // Layout Wide (0, 3)
          if (layoutType === 0 || layoutType === 3) {
            return (
              <Link
                key={article.id}
                href={`/artigos/${article.slug}`}
                className="md:col-span-2 group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 block"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-2/5 relative">
                    <div className="relative w-full h-56 sm:h-full">
                      <Image
                        src={article.image_url}
                        alt={article.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 font-inter">
                        <span className="text-xs font-bold text-pink-500 uppercase">
                          {article.tags?.[0] || 'NBA'}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(article.published_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="font-oswald text-sm md:text-lg font-bold uppercase text-gray-900 mb-3 group-hover:text-pink-500 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 font-inter">
                        {article.summary}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link font-inter"
                    >
                      Ler mais
                      <svg
                        className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          }

          // Layout Full Width (2, 5)
          if (layoutType === 2 || layoutType === 5) {
            return (
              <Link
                key={article.id}
                href={`/artigos/${article.slug}`}
                className="md:col-span-2 lg:col-span-3 group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 block"
              >
                <div className="grid lg:grid-cols-2">
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="relative w-full h-full aspect-video lg:aspect-auto">
                      <Image
                        src={article.image_url}
                        alt={article.title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={getObjectPositionStyle(article.image_focal_point)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-8">
                    <div className="flex items-center gap-2 mb-4 font-inter">
                      <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {article.tags?.[0] || 'NBA'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-oswald text-xl md:text-2xl font-black uppercase text-gray-900 mb-4 leading-tight group-hover:text-pink-600 transition-colors">
                      {article.title}
                    </h3>
                    {article.subtitle && (
                      <p className="text-lg text-gray-700 mb-4 font-inter">{article.subtitle}</p>
                    )}
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 font-inter">
                      {article.summary}
                    </p>
                    <span
                      className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 mt-4 group/link w-fit font-inter"
                    >
                      Ler Matéria Completa
                      <svg
                        className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          }

          // Layout Padrão (1, 4)
          return (
            <Link
              key={article.id}
              href={`/artigos/${article.slug}`}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 block"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  style={getObjectPositionStyle(article.image_focal_point)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase font-inter">
                    {article.tags?.[0] || 'NBA'}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 font-inter">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 className="font-oswald text-sm md:text-base font-bold uppercase text-gray-900 mb-3 line-clamp-2 group-hover:text-pink-500 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-inter">
                  {article.summary}
                </p>
                <span
                  className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600 group/link font-inter"
                >
                  Leia mais
                  <svg
                    className="w-4 h-4 group-hover/link:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}