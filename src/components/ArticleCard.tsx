import { Link } from 'react-router-dom';

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
      className="article-card group fade-in flex flex-col"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Imagem */}
      <div className="relative overflow-hidden h-48">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {/* Badge da fonte */}
        {article.source && (
          <div className="absolute top-3 left-3">
            <span className="tag-cyan">
              {article.source}
            </span>
          </div>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#FA007D] transition-colors">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
          {article.summary}
        </p>
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag} 
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 mt-auto">
          <span>
            {new Date(article.published_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          <span className="text-[#00DBFB] group-hover:text-[#FA007D] font-semibold transition-colors">
            Ler mais →
          </span>
        </div>
      </div>
    </Link>
  );
}