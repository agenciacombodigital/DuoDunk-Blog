"use client";
import { useMilhaoGame } from '@/hooks/useMilhaoGame';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PRIZE_LADDER } from '@/lib/milhao-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RefreshCw, X, AlertTriangle, Play } from 'lucide-react'; // Removendo Zap, SkipForward, Users, BookOpen
import MilhaoTimer from './MilhaoTimer';
import { supabase } from '@/lib/supabase'; // Mantido para uso futuro, mas fetch removido

// Interface para as configurações visuais
export interface QuizSettings {
  logo_url?: string;
  victory_image_url?: string;
  defeat_image_url?: string;
  cards_image_url?: string;
  rookies_image_url?: string;
}

const DEFAULT_SETTINGS: QuizSettings = {
  logo_url: '/images/duodunk-logoV2.svg',
  victory_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  defeat_image_url: 'https://images.unsplash.com/photo-1518091043521-49e79c9eb6e8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};


export default function MilhaoInterface({ initialSettings }: { initialSettings: QuizSettings }) {
  const { 
    gameState, 
    setGameState,
    currentQuestion, 
    prize, 
    loading, 
    startGame, 
    handleAnswer, 
    handleStop,
    timer,
    cheatAttempts,
    currentQIndex,
    questions,
    MAX_QUESTIONS,
    INITIAL_TIME,
  } = useMilhaoGame();
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Inicia o estado com as configurações passadas via props
  const [settings] = useState<QuizSettings>({ ...DEFAULT_SETTINGS, ...initialSettings }); 

  // Limpa as opções escondidas quando muda a pergunta
  useEffect(() => {
    setHiddenOptions([]);
    setSelectedOption(null);
    setIsAnswerLocked(false);
  }, [currentQuestion]);

  const handleSelectAnswer = (selectedIndex: number) => {
    if (isAnswerLocked) return;
    
    setIsAnswerLocked(true);
    setSelectedOption(selectedIndex);
    
    // Dá um pequeno delay para a animação antes de processar
    setTimeout(() => {
      handleAnswer(selectedIndex);
    }, 1500);
  };
  
  // As funções de ajuda foram removidas, assim como as chamadas no código.
  
  const handleResumeGame = () => {
    setGameState('playing');
    toast.info("Jogo retomado. Concentre-se! 🧠");
  };

  if (loading) return <div className="text-white text-center p-10 font-oswald text-2xl animate-pulse">Carregando a quadra...</div>;

  // --- TELA INICIAL (NOVO DESIGN) ---
  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* LOGO JÁ CARREGADO (SEM PISCAR) */}
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt="Milhão NBA" 
            className="w-full max-w-md md:max-w-lg object-contain drop-shadow-[0_0_25px_rgba(255,0,255,0.6)] mb-4"
            // priority="true" // Removido, pois não é o componente Image do Next.js
          />
        ) : (
          <h1 className="text-6xl md:text-8xl font-bebas text-transparent bg-clip-text bg-gradient-to-b from-[#ff00ff] to-[#00bfff] mb-4 drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]">
            MILHÃO NBA
          </h1>
        )}

        <h2 className="text-2xl md:text-4xl font-bebas text-white tracking-widest uppercase">
          O Desafio Definitivo
        </h2>
        
        <button 
          onClick={startGame} 
          disabled={loading}
          className="bg-gradient-to-r from-[#ff00ff] to-[#00bfff] text-white font-black text-2xl py-4 px-16 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,191,255,0.6)] font-oswald uppercase tracking-wide"
        >
          {loading ? 'Carregando...' : 'ENTRAR EM QUADRA'}
        </button>

      </div>
    );
  }

  // --- TELA DE VITÓRIA/DERROTA (NOVO DESIGN) ---
  if (gameState === 'won' || gameState === 'lost' || gameState === 'stopped') {
    const finalPrize = gameState === 'won' ? PRIZE_LADDER[MAX_QUESTIONS] : prize; 
    const isWon = gameState === 'won';
    const isStopped = gameState === 'stopped';
    
    // Escolher imagem baseada no resultado
    const resultImage = isWon ? settings.victory_image_url : settings.defeat_image_url;

    return (
      <div className="text-center p-10 bg-black/60 rounded-3xl border border-white/10 backdrop-blur-md max-w-lg mx-auto animate-in fade-in zoom-in">
        
        {resultImage && (
          <img 
            src={resultImage} 
            alt={isWon ? "Vitória" : "Derrota"} 
            className="w-48 h-48 mx-auto mb-6 object-cover rounded-full border-4 border-[#ff00ff]" 
          />
        )}

        <h2 className="text-6xl font-bebas mb-4 text-white">
            {isWon ? '🏆 CAMPEÃO!' : isStopped ? '🛑 PAROU!' : '❌ ELIMINADO!'}
        </h2>
        <p className="text-xl text-gray-300 mb-2 font-inter">
            {isWon ? 'Você acertou todas as 23 perguntas!' : isStopped ? 'Você decidiu parar o jogo.' : 'Resposta incorreta ou tempo esgotado.'}
        </p>
        <p className={cn("text-5xl font-black mb-8 font-oswald", isWon ? "text-green-400" : "text-[#ff00ff]")}>
            R$ {finalPrize.toLocaleString('pt-BR')}
        </p>
        <button onClick={startGame} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors font-oswald uppercase flex items-center gap-2 mx-auto">
            <RefreshCw size={20} /> Jogar Novamente
        </button>
      </div>
    );
  }
  
  // --- TELA DE PAUSA (TRAPAÇA) ---
  if (gameState === 'paused') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg">
        <div className="text-center p-10 bg-zinc-900 rounded-3xl border-4 border-red-500 max-w-md mx-auto animate-in fade-in zoom-in">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-4xl font-bebas mb-4 text-white">JOGO PAUSADO</h2>
          <p className="text-lg text-gray-300 mb-6 font-inter">
            Detectamos que você saiu da aba. Tentativas: ({cheatAttempts}/3).
          </p>
          <button onClick={handleResumeGame} className="bg-[#ff00ff] text-white font-bold py-3 px-8 rounded-full hover:bg-[#cc00cc] transition-colors font-oswald uppercase flex items-center gap-2 mx-auto">
              <Play size={20} /> Retomar Jogo
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) return null;

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Coluna Esquerda: Pergunta e Opções */}
      <div className="lg:col-span-2">
        
        {/* Timer */}
        <MilhaoTimer time={timer} initialTime={INITIAL_TIME} />

        {/* Ajudas (REMOVIDO) */}
        <div className="mb-6 h-10" /> 

        {/* Pergunta */}
        <motion.div 
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6 md:p-8 rounded-3xl border-2 border-[#ff00ff]/50 shadow-2xl mb-8 text-center"
        >
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 block font-inter">
              Nível {currentQIndex + 1} • Pergunta {currentQIndex + 1}
          </span>
          <h3 className="text-2xl md:text-3xl text-white font-bold leading-relaxed font-oswald tracking-wide drop-shadow-[0_0_5px_rgba(255,0,255,0.3)]">
              {currentQuestion.question}
          </h3>
        </motion.div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((opt, idx) => (
            !hiddenOptions.includes(idx) ? (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                onClick={() => handleSelectAnswer(idx)}
                disabled={isAnswerLocked}
                className={cn(
                    "border text-white p-5 rounded-xl text-lg font-medium transition-all text-left flex items-center gap-4 group",
                    isAnswerLocked && selectedOption === idx 
                        ? (idx === currentQuestion.correct_index ? "bg-green-600 border-green-700 shadow-lg shadow-green-900/50" : "bg-red-600 border-red-700 shadow-lg shadow-red-900/50")
                        : "bg-white/10 border-[#00bfff]/20 hover:bg-[#00bfff]/10 disabled:opacity-50"
                )}
              >
                <span className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-inter transition-colors shrink-0",
                    isAnswerLocked && selectedOption === idx 
                        ? "bg-white text-black" 
                        : "bg-black/40 group-hover:bg-[#ff00ff] group-hover:text-white"
                )}>
                    {['A','B','C','D'][idx]}
                </span>
                <span className="font-inter">{opt}</span>
              </motion.button>
            ) : <div key={idx} className="invisible h-[84px]" /> // Mantém o espaço para o layout
          ))}
        </div>
        
        {/* Botão Parar */}
        <div className="mt-8 text-center">
            <button 
                onClick={handleStop} 
                disabled={isAnswerLocked}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-colors font-oswald uppercase flex items-center gap-2 mx-auto disabled:opacity-50"
            >
                <X size={20} /> Parar e Levar
            </button>
        </div>
      </div>
      
      {/* Coluna Direita: Escada de Prêmios */}
      <div className="lg:col-span-1 bg-zinc-900 rounded-2xl p-6 border border-white/10 shadow-xl">
        <h4 className="text-xl font-oswald text-[#00bfff] mb-4 uppercase tracking-wider">Escada de Prêmios</h4>
        <div className="space-y-1">
          {PRIZE_LADDER.slice().reverse().map((p, index) => {
            const qNum = PRIZE_LADDER.length - index;
            const isCurrent = qNum === currentQIndex + 1 && gameState === 'playing';
            const isPassed = qNum <= currentQIndex;
            const isSafe = qNum === 1 || qNum === 8 || qNum === 15 || qNum === 23; // Marcos de segurança
            
            return (
              <div 
                key={qNum} 
                className={cn(
                  "flex justify-between p-2 rounded-lg transition-all",
                  isCurrent && "bg-[#ff00ff]/20 border border-[#ff00ff]/50 text-white font-bold",
                  isPassed && "text-gray-500 line-through",
                  isSafe && "font-bold text-[#00bfff]",
                  !isCurrent && !isPassed && "text-gray-300"
                )}
              >
                <span className="text-sm font-inter">{qNum}.</span>
                <span className="text-sm font-oswald tracking-wide">R$ {p.toLocaleString('pt-BR')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Removendo LifelineButton, pois não é mais usado.