import { Link } from 'react-router-dom';
import { CheckCircle, Edit, Trash2 } from 'lucide-react';

interface PublishedArticlesSectionProps {
  articles: any[];
  onDelete: (articleId: string) => void;
}

export default function PublishedArticlesSection({ articles, onDelete }: PublishedArticlesSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="w-6 h-6 text-green-400" />
        Últimos Publicados ({articles.length})
      </h2>
      <div className="space-y-2">
        {articles.map((article) => (
          <div key={article.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-700/50 transition-colors">
            <div className="flex-1 min-w-0">
              <a href={`/artigos/${article.slug}`} target="_blank" rel="noopener noreferrer" className="text-white font-semibold text-sm hover:text-green-400 truncate block">{article.title}</a>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{article.source}</span>
                <span className="text-xs text-gray-500">{new Date(article.published_at).toLocaleDateString('pt-BR')}</span>
                <span className="text-xs text-cyan-400">{article.views || 0} views</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Link to={`/admin/editar/${article.slug}`} className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"><Edit className="w-4 h-4" /></Link>
              <button onClick={() => onDelete(article.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}