import { AlertTriangle, Trash2 } from 'lucide-react';

interface PendingProcessingSectionProps {
  articles: any[];
  onDelete: (articleId: string) => void;
}

export default function PendingProcessingSection({ articles, onDelete }: PendingProcessingSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
      <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        Aguardando Coleta/Processamento ({articles.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.slice(0, 6).map((article) => (
          <div key={article.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col justify-between">
            <div>
              <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded-full font-semibold">{article.source}</span>
              <h4 className="text-white font-semibold text-sm mt-2 line-clamp-2">{article.original_title}</h4>
              <p className="text-gray-400 text-xs mt-1">{new Date(article.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
              <button onClick={() => onDelete(article.id)} className="p-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors" title="Deletar da fila">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}