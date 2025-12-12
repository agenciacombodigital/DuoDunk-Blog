"use client";
import { useMilhaoGame } from '@/hooks/useMilhaoGame';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PRIZE_LADDER } from '@/lib/milhao-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RefreshCw, X, AlertTriangle, Play, Clock, Zap, Shield, Users, ShieldAlert, User, CheckCircle2 } from 'lucide-react';
import MilhaoTimer from './MilhaoTimer';
import { supabase } from '@/lib/supabase';

// Interface para tipagem
interface QuizSettings {
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
    currentQIndex,
    questions,
    MAX_QUESTIONS,
    INITIAL_TIME,
  } = useMilhaoGame();
  
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Inicia o estado JÁ com os dados vindos do servidor (Zero Delay)
  const settings = { ...DEFAULT_SETTINGS, ...initialSettings }; 

  // Estados do Cadastro (Simplificado: Só Nome)
  const [showRegistration, setShowRegistration] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // --- 1. ANTI-CHEAT ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing') {
        setGameState('lost');
        toast.error("FALTA TÉCNICA! Você saiu da aba do jogo.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameState, setGameState]);

  // --- 2. SALVAR RESULTADO (RANKING) ---
  useEffect(() => {
    // Salva apenas Nome e Prêmio
    if ((gameState === 'won' || gameState === 'lost' || gameState === 'stopped') && !isAnonymous && playerName && prize > 0) {
        const saveScore = async () => {
            await supabase.from('quiz_rankings').insert({
                player_name: playerName.substring(0, 150),
                prize_won: prize,
            });
            toast.success("Pontuação salva no Ranking!");
        };
        saveScore();
    }
  }, [gameState, isAnonymous, playerName, prize]);

  const handleStartWithRegistration = (anonymous: boolean) => {
    if (!anonymous) {
        if (!playerName.trim() || playerName.trim().split(' ').length < 2) {
            return toast.error("Por favor, digite Nome e Sobrenome.");
        }
    }
    setIsAnonymous(anonymous);
    setShowRegistration(false);
    startGame();
  };

  // Limpa as opções escondidas quando muda a pergunta
  useEffect(() => {
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
  
  const isOptionEliminated = (index: number) => {
    return false;
  };

  if (loading) return <div className="text-white text-center p-10 font-oswald text-2xl animate-pulse">Carregando a quadra...</div>;

  // --- TELA INICIAL ---
  if (gameState === 'start') {
    if (showRegistration) {
        return (
            <div className="w-full max-w-md bg-[#121212] border border-[#333] rounded-2xl p-8 shadow-[0_0_60px_rgba(0,191,255,0.2)] animate-in zoom-in duration-300">
                <h2 className="text-3xl font-bebas text-center mb-2 text-white">VENCEDORES DA SEMANA 🏆</h2>
                <p className="text-gray-400 text-xs text-center mb-6">O Ranking reseta toda segunda-feira!</p>
                
                <div className="space-y-6 mb-8">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3 text-sm text-gray-300">
                        <p className="font-bold text-white mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> COMO CONCORRER:</p>
                        <ul className="space-y-2 list-disc pl-4">
                            <li>Jogue com <strong>Nome e Sobrenome</strong>.</li>
                            <li>Siga a <strong>@duodunk</strong> no Instagram (botão no topo do site).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Identificação</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                            <input 
                                className="w-full bg-black border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-cyan-500 outline-none transition placeholder:text-gray-600"
                                placeholder="Nome e Sobrenome"
                                value={playerName}
                                onChange={e => setPlayerName(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleStartWithRegistration(false)}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl uppercase tracking-wide shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                        Jogar Valendo Prêmios
                    </button>
                    <button 
                        onClick={() => handleStartWithRegistration(true)}
                        className="w-full text-gray-500 hover:text-white text-xs font-bold uppercase transition"
                    >
                        Pular e Jogar Modo Anônimo
                    </button>
                </div>
            </div>
        );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto w-full">
        
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt="Milhão NBA" 
            className="w-full max-w-[280px] md:max-w-md object-contain drop-shadow-[0_0_35px_rgba(255,0,255,0.4)] mb-2"
            // Não precisa de priority="true" aqui, pois o Next.js já otimiza
          />
        ) : (
          <h1 className="text-6xl font-bebas text-transparent bg-clip-text bg-gradient-to-b from-[#ff00ff] to-[#00bfff]">MILHÃO NBA</h1>
        )}
        
        <h2 className="text-xl md:text-2xl font-bebas text-white tracking-widest uppercase">
          O Desafio Mais Difícil do Brasil
        </h2>
        
        <button 
          onClick={() => setShowRegistration(true)} 
          disabled={loading}
          className="bg-gradient-to-r from-[#ff00ff] to-[#00bfff] text-white font-black text-xl md:text-2xl py-4 px-12 md:px-16 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,191,255,0.6)] font-oswald uppercase tracking-wide"
        >
          {loading ? 'Carregando...' : 'ENTRAR EM QUADRA'}
        </button>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5">
             <ShieldAlert className="w-4 h-4 text-red-500" /> Anti-Cheat Ativado: Proibido sair da aba
        </div>
      </div>
    );
  }

  // --- TELA DE VITÓRIA/DERROTA/PARADA ---
  if (gameState === 'won' || gameState === 'lost' || gameState === 'stopped') {
    const finalPrize = gameState === 'won' ? PRIZE_LADDER[MAX_QUESTIONS] : prize; 
    const isWon = gameState === 'won';
    const isStopped = gameState === 'stopped';
    
    const resultImage = isWon ? settings.victory_image_url : settings.defeat_image_url;

    return (
      <div className="text-center p-8 md:p-12 bg-black/60 rounded-3xl border border-white/10 backdrop-blur-xl max-w-lg mx-auto animate-in fade-in zoom-in shadow-2xl">
        
        {resultImage && (
          <img 
            src={resultImage} 
            alt={isWon ? "Vitória" : "Derrota"} 
            className="w-40 h-40 mx-auto mb-6 object-cover rounded-full border-4 border-[#ff00ff]" 
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
  
  if (!currentQuestion) return null;

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Coluna Esquerda: Pergunta e Opções */}
      <div className="lg:col-span-2">
        
        {/* Timer */}
        <MilhaoTimer time={timer} initialTime={INITIAL_TIME} />
        
        {/* Pergunta */}
        <motion.div 
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl mb-8 text-center backdrop-blur-md"
        >
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 block font-inter">
              Nível {currentQIndex + 1} • R$ {PRIZE_LADDER[currentQIndex + 1].toLocaleString('pt-BR')}
          </span>
          <h3 className="text-2xl md:text-3xl text-white font-bold leading-relaxed font-oswald tracking-wide drop-shadow-[0_0_5px_rgba(255,0,255,0.3)]">
              {currentQuestion.question}
          </h3>
        </motion.div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((opt, idx) => (
            !isOptionEliminated(idx) ? (
              <motion.button
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                onClick={() => handleSelectAnswer(idx)}
                disabled={isAnswerLocked}
                className={cn(
                    "border text-white p-5 rounded-xl text-lg font-medium transition-all text-left flex items-center gap-4 group bg-white/5 backdrop-blur-sm",
                    isAnswerLocked && selectedOption === idx 
                        ? (idx === currentQuestion.correct_index ? "bg-green-600 border-green-700 shadow-lg shadow-green-900/50" : "bg-red-600 border-red-700 shadow-lg shadow-red-900/50")
                        : "border-[#ff00ff]/20 hover:bg-[#00bfff]/10 disabled:opacity-50"
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
            ) : <div key={idx} className="invisible h-[84px] bg-white/5 rounded-xl backdrop-blur-sm" /> // Mantém o espaço para o layout
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
      <div className="lg:col-span-1 bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl backdrop-blur-md">
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