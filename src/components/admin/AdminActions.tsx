"use client";

import Link from 'next/link';
import { Bot, Calendar, Edit3, RefreshCw, Trash2, AlertTriangle, Play, Wand2 } from 'lucide-react';

interface AdminActionsProps {
  isLoading: boolean;
  onScrape: () => void;
  onProcess: () => void;
  onDeleteAll: () => void;
  onRetryRateLimited: () => void;
  readyToRetryCount: number;
  onGenerateAutoAgenda: () => void;
  onGeneratePredictions: () => void;
}

const ButtonBase = "flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs px-4 py-3 h-auto rounded-xl transition-all duration-300 transform hover:scale-[1.02]";

export default function AdminActions({ 
  isLoading, 
  onScrape, 
  onProcess, 
  onDeleteAll, 
  onRetryRateLimited, 
  readyToRetryCount, 
  onGenerateAutoAgenda,
  onGeneratePredictions 
}: AdminActionsProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
      <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-cyan-400" />Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <button onClick={onScrape} disabled={isLoading} className={`btn-cyan ${ButtonBase}`} title="Coletar notícias dos feeds RSS"><RefreshCw className="w-4 h-4" /> Coletar</button>
        <button onClick={onProcess} disabled={isLoading} className={`btn-magenta ${ButtonBase}`} title="Processar próximo artigo da fila com IA"><Play className="w-4 h-4" /> Processar IA</button>
        <button 
          onClick={onRetryRateLimited} 
          disabled={isLoading || readyToRetryCount === 0} 
          className={`bg-red-600 hover:bg-red-700 text-white ${ButtonBase}`}
          title="Retentar artigos que falharam por limite de cota"
        >
          <AlertTriangle className="w-4 h-4" /> Retentar ({readyToRetryCount})
        </button>
        
        <button onClick={onGeneratePredictions} disabled={isLoading} className={`bg-blue-600 hover:bg-blue-700 text-white ${ButtonBase}`} title="Analisar jogos de hoje e gerar palpites">
          <Wand2 className="w-4 h-4" /> Gerar Palpites
        </button>

        <Link href="/admin/manual" className={`btn-success ${ButtonBase}`} title="Criar uma notícia do zero manualmente"><Edit3 className="w-4 h-4" /> Manual</Link>
        
        <button onClick={onGenerateAutoAgenda} disabled={isLoading} className={`bg-purple-600 hover:bg-purple-700 text-white ${ButtonBase}`} title="Gerar agenda de transmissões automaticamente">
          <Bot className="w-4 h-4" /> Auto Agenda
        </button>
        
        <button onClick={onDeleteAll} disabled={isLoading} className={`btn-danger ${ButtonBase}`} title="DELETAR TODAS as notícias publicadas do site"><Trash2 className="w-4 h-4" /> ⚠️ Deletar Tudo</button>
      </div>
    </div>
  );
}