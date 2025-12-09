"use client";
import { useMilhaoGame } from '@/hooks/useMilhaoGame';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PRIZE_LADDER } from '@/lib/milhao-data';
import { cn } from '@/lib/utils';

export default function MilhaoInterface() {
  const { gameState, currentQuestion, prize, loading, startGame, handleAnswer, useFiftyFifty, lifelines } = useMilhaoGame();
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

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
  
  const handleUseFiftyFifty = () => {
    if (isAnswerLocked) return;
    const h = useFiftyFifty(); 
    if(h) setHiddenOptions(h);
  };

  if (loading) return <div className="text-white text-center p-10 font-oswald text-2xl animate-pulse">Carregando a quadra...</div>;

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <h2 className="text-5xl md:text-7xl font-bebas text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
          Você sabe tudo de NBA?
        </h2>
        <p className="text-gray-300 text-lg max-w-md font-inter">
          Responda corretamente, use as ajudas com sabedoria e conquiste o anel de campeão.
        </p>
        <button onClick={startGame} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-black text-2xl py-4 px-12 rounded-full hover:scale-105 transition-transform shadow-xl font-oswald uppercase tracking-wide">
          ENTRAR EM QUADRA
        </button>
      </div>
    );
  }

  if (gameState === 'won' || gameState === 'lost') {
    const finalPrize = gameState === 'won' ? prize : 0; // Se perdeu, o prêmio é 0
    
    return (
      <div className="text-center p-10 bg-black/60 rounded-3xl border border-white/10 backdrop-blur-md max-w-lg mx-auto animate-in fade-in zoom-in">
        <h2 className="text-6xl font-bebas mb-4 text-white">
            {gameState === 'won' ? '🏆 MVP! MVP!' : '❌ TOCO!'}
        </h2>
        <p className="text-xl text-gray-300 mb-2 font-inter">Você parou com:</p>
        <p className="text-5xl font-black text-green-400 mb-8 font-oswald">R$ {finalPrize.toLocaleString('pt-BR')}</p>
        <button onClick={startGame} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors font-oswald uppercase">
            Jogar Novamente
        </button>
      </div>
    );
  }
  
  if (!currentQuestion) return null;

  const currentPrizeIndex = PRIZE_LADDER.indexOf(prize);
  const nextPrize = PRIZE_LADDER[currentPrizeIndex + 1] || 1000000;

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Coluna Esquerda: Pergunta e Opções */}
      <div className="lg:col-span-2">
        {/* Placar e Ajudas */}
        <div className="flex justify-between items-center mb-6 bg-black/60 backdrop-blur p-4 rounded-xl border border-white/10">
          <div className="text-yellow-400 font-bebas text-2xl md:text-3xl tracking-wide">
              Prêmio Atual: <span className="text-white">R$ {prize.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleUseFiftyFifty} 
              disabled={!lifelines.fifty || isAnswerLocked}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-lg disabled:opacity-50 text-sm font-bold font-inter transition-colors flex items-center gap-1"
            >
              50/50 {lifelines.fifty ? '✅' : '❌'}
            </button>
          </div>
        </div>

        {/* Pergunta */}
        <motion.div 
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-6 md:p-8 rounded-3xl border-2 border-yellow-500/20 shadow-2xl mb-8 text-center"
        >
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 block font-inter">
              Nível {currentQuestion.level} • Pergunta {currentQuestion.sequence_num}
          </span>
          <h3 className="text-2xl md:text-3xl text-white font-bold leading-relaxed font-oswald tracking-wide">
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
                        : "bg-white/10 border-white/10 hover:bg-white/20"
                )}
              >
                <span className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-inter transition-colors shrink-0",
                    isAnswerLocked && selectedOption === idx 
                        ? "bg-white text-black" 
                        : "bg-black/40 group-hover:bg-yellow-500 group-hover:text-black"
                )}>
                    {['A','B','C','D'][idx]}
                </span>
                <span className="font-inter">{opt}</span>
              </motion.button>
            ) : <div key={idx} className="invisible h-[84px]" /> // Mantém o espaço para o layout
          ))}
        </div>
      </div>
      
      {/* Coluna Direita: Escada de Prêmios */}
      <div className="lg:col-span-1 bg-zinc-900 rounded-2xl p-6 border border-white/10 shadow-xl">
        <h4 className="text-xl font-oswald text-yellow-400 mb-4 uppercase tracking-wider">Escada de Prêmios</h4>
        <div className="space-y-1">
          {PRIZE_LADDER.slice().reverse().map((p, index) => {
            const qNum = PRIZE_LADDER.length - index;
            const isCurrent = p === prize && gameState === 'playing';
            const isPassed = p < prize;
            const isSafe = qNum % 5 === 1; // Perguntas 1, 6, 11, 16 são marcos de segurança
            
            return (
              <div 
                key={qNum} 
                className={cn(
                  "flex justify-between p-2 rounded-lg transition-all",
                  isCurrent && "bg-yellow-500/20 border border-yellow-500/50",
                  isPassed && "text-gray-500 line-through",
                  isSafe && "font-bold text-green-400"
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