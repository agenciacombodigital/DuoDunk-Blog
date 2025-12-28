"use client";

import Link from 'next/link';
import { Bot, Calendar, Edit3, RefreshCw, Trash2, AlertTriangle, Play, FilePlus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Importando useRouter

interface AdminActionsProps {
  isLoading: boolean;
  onScrape: () => void;
  onProcess: () => void;
  onDeleteAll: () => void;
  onRetryRateLimited: () => void;
  readyToRetryCount: number; // Novo
  onGenerateAutoAgenda: () => void; // Nova função recebida
}

const ButtonBase = "flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm md:text-base px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02]";

export default function AdminActions({ isLoading, onScrape, onProcess, onDeleteAll, onRetryRateLimited, readyToRetryCount, onGenerateAutoAgenda }: AdminActionsProps) {
  // Inicializando useRouter
  const router = useRouter();
  
  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
      <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-400" />Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <button onClick={onScrape} disabled={isLoading} className={`btn-cyan ${ButtonBase}`}><RefreshCw className="w-4 h-4" /> Coletar</button>
        <button onClick={onProcess} disabled={isLoading} className={`btn-magenta ${ButtonBase}`}><Play className="w-4 h-4" /> Processar IA</button>
        <button 
          onClick={onRetryRateLimited} 
          disabled={isLoading || readyToRetryCount === 0} 
          className={`bg-red-600 hover:bg-red-700 text-white ${ButtonBase}`}
        >
          <AlertTriangle className="w-4 h-4" /> Retentar ({readyToRetryCount})
        </button>
        {/* Usando Link do Next.js para navegação */}
        <Link href="/admin/manual" className={`btn-success ${ButtonBase}`}><Edit3 className="w-4 h-4" /> Manual</Link>
        
        {/* NOVO BOTÃO */}
        <button onClick={onGenerateAutoAgenda} disabled={isLoading} className={`bg-purple-600 hover:bg-purple-700 text-white ${ButtonBase}`}>
          <Bot className="w-4 h-4" /> Auto Agenda
        </button>
        
        <button onClick={onDeleteAll} disabled={isLoading} className={`btn-danger ${ButtonBase}`}><Trash2 className="w-4 h-4" /> ⚠️ Deletar Tudo</button>
      </div>
    </div>
  );
}