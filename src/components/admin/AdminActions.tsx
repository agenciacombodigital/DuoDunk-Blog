import { Link } from 'react-router-dom';
import { Bot, Calendar, Edit3, RefreshCw, Trash2 } from 'lucide-react';

interface AdminActionsProps {
  isLoading: boolean;
  onScrape: () => void;
  onProcess: () => void;
  onDeleteAll: () => void;
}

export default function AdminActions({ isLoading, onScrape, onProcess, onDeleteAll }: AdminActionsProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Bot className="w-6 h-6 text-cyan-400" />Ações</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <button onClick={onScrape} disabled={isLoading} className="btn-cyan flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><RefreshCw className="w-5 h-5" /> Coletar Notícias</button>
        <button onClick={onProcess} disabled={isLoading} className="btn-magenta flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Bot className="w-5 h-5" /> Processar com IA</button>
        <Link to="/admin/manual" className="btn-success flex items-center justify-center gap-2"><Edit3 className="w-5 h-5" /> Publicação Manual</Link>
        <Link to="/admin/rodada-nba" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"><Calendar className="w-5 h-5" /> Criar Rodada NBA</Link>
        <button onClick={onDeleteAll} disabled={isLoading} className="btn-danger flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-5 h-5" /> ⚠️ Deletar Publicados</button>
      </div>
    </div>
  );
}