import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image_url: string;
  source: string;
  tags: string[];
  published_at: string;
}

export default function ArticleCard({ article, index = 0 }: { article: Article, index?: number }) {
  return (
    <Link
      to={`/artigos/${article.slug}`}
      className="group fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
        {/* Imagem */}
        <div className="aspect-video relative overflow-hidden bg-gray-200">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute top-3 left-3 bg-[#FA007D] text-white text-xs font-bold px-3 py-1 rounded-full">
            {article.source || 'NBA'}
          </span>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span>
              📅 {formatDistanceToNow(new Date(article.published_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
            <span>
              ⏱️ 5 min de leitura
            </span>
          </div>

          {/* Título */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#FA007D] transition-colors">
            {article.title}
          </h3>

          {/* Resumo */}
          <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed flex-grow">
            {article.summary}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}