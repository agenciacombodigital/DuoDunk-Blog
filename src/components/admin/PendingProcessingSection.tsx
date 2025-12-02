import { AlertTriangle, Trash2 } from 'lucide-react';

interface PendingProcessingSectionProps {
  articles: any[];
  onDelete: (articleId: string) => void;
}

export default function PendingProcessingSection({ articles, onDelete }: PendingProcessingSectionProps) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Aguardando Processamento ({articles.length})
        </h2>
      </div>
      
      {/* Grid sem limite de slice (mostra tudo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
        {articles.map((article) => (
          <div key={article.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col justify-between group hover:border-gray-600 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 text-xs rounded-full font-semibold border border-yellow-700/30">
                  {article.source}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {new Date(article.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 
                className="text-white font-inter font-semibold text-base mt-2 line-clamp-2 leading-snug" 
                title={article.original_title}
              >
                {article.original_title}
              </h4>
              
              {/* Data e Hora de Coleta */}
              <p className="text-gray-400 text-xs mt-1 font-inter">
                Coletado em: {new Date(article.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(article.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              <a href={article.original_link} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-2 block hover:underline truncate">
                Ver original
              </a>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
              <button 
                onClick={() => onDelete(article.id)} 
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" 
                title="Deletar da fila"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}