"use client";
import { useMilhaoGame } from '@/hooks/useMilhaoGame';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Trophy, ShieldAlert, User, X, Crown, Loader2, Play, Home, AlertCircle } from 'lucide-react';
import { PRIZE_LADDER } from '@/lib/milhao-data';
import { cn } from '@/lib/utils';
import MilhaoTimer from './MilhaoTimer';

interface QuizSettings {
  logo_url?: string;
  victory_image_url?: string;
  defeat_image_url?: string;
}

export default function MilhaoInterface({ initialSettings }: { initialSettings: QuizSettings }) {
  const { 
    gameState, setGameState, currentQuestion, prize, loading: gameLoading, startGame, handleAnswer, 
    handleStop, timer 
  } = useMilhaoGame();
  
  const [settings] = useState<QuizSettings>(initialSettings);
  
  // Estados de Interface
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  
  // Estados do Jogador
  const [playerName, setPlayerName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [checkingName, setCheckingName] = useState(false); // Loading da verificação de nome

  // Estados Visuais (Feedback)
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'correct' | 'wrong' | null>(null);

  // --- 1. ANTI-CHEAT ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing') {
        setGameState('lost');
        toast.error("FALTA TÉCNICA! Saiu da quadra, está eliminado.", { icon: '🚫' });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [gameState, setGameState]);

  // --- 2. SALVAR RESULTADO (COM TRATAMENTO DE ERRO) ---
  useEffect(() => {
    if ((gameState === 'won' || gameState === 'lost' || gameState === 'stopped') && !isAnonymous && playerName && prize > 0) {
        const saveScore = async () => {
            const { error } = await supabase.from('quiz_rankings').insert({
                player_name: playerName.trim(),
                prize_won: prize,
            });

            if (error) {
                // Código 23505 = Violação de Unicidade (Nome duplicado que passou pelo filtro)
                if (error.code === '23505') {
                    toast.error(`O nome "${playerName}" já tem um recorde nesta semana!`);
                } else {
                    console.error("Erro ao salvar:", error);
                }
            } else {
                toast.success("Pontuação salva no Ranking!");
            }
        };
        saveScore();
    }
  }, [gameState, isAnonymous, playerName, prize]);

  // --- 3. BUSCAR RANKING ---
  const fetchRanking = async () => {
      setLoadingRanking(true);
      setShowRanking(true);
      const { data } = await supabase
        .from('quiz_rankings')
        .select('player_name, prize_won')
        .order('prize_won', { ascending: false })
        .limit(10);
      setRankingData(data || []);
      setLoadingRanking(false);
  };

  // --- 4. START COM VERIFICAÇÃO DE NOME ---
  const handleStartWithRegistration = async (anonymous: boolean) => {
    if (!anonymous) {
        const name = playerName.trim();
        // Validação de tamanho
        if (!name || name.split(' ').length < 2) {
            return toast.error("Digite Nome e Sobrenome para validar.");
        }
        
        setCheckingName(true);
        
        // Verifica no banco se o nome já existe (Case Insensitive)
        const { data } = await supabase
            .from('quiz_rankings')
            .select('id')
            .ilike('player_name', name) 
            .limit(1);
            
        setCheckingName(false);

        if (data && data.length > 0) {
            return toast.error("Este nome já jogou esta semana! Adicione um diferencial (ex: Jr, 2, ou apelido).", {
                duration: 5000,
                icon: <AlertCircle className="text-red-500" />
            });
        }
    }
    
    setIsAnonymous(anonymous);
    setShowRegistration(false);
    setSelectedOption(null);
    setAnswerStatus(null);
    startGame();
  };

  // --- 5. VISUAL DA RESPOSTA (CORES DUODUNK) ---
  const onOptionClick = (idx: number) => {
      if (selectedOption !== null) return; 

      setSelectedOption(idx);
      const isCorrect = idx === currentQuestion.correct_index;
      
      setAnswerStatus(isCorrect ? 'correct' : 'wrong');

      setTimeout(() => {
          handleAnswer(idx);
          if (isCorrect) {
              setSelectedOption(null);
              setAnswerStatus(null);
          }
      }, 1000);
  };

  const handleBackToMenu = () => setGameState('start');

  // --- TELA INICIAL ---
  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 relative min-h-[60vh]">
        
        {/* MODAL RANKING */}
        {showRanking && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowRanking(false)}>
                <div className="bg-[#121212] border border-gray-700 w-full max-w-sm md:max-w-md rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowRanking(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"><X /></button>
                    <h2 className="text-2xl font-bebas text-white mb-6 flex items-center justify-center gap-2"><Crown className="text-yellow-500 w-6 h-6"/> TOP 10 SEMANAL</h2>
                    
                    {loadingRanking ? (
                        <div className="py-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-cyan-500 mx-auto"/></div>
                    ) : (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                            {rankingData.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800 transition">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 text-center ${i < 3 ? 'text-yellow-400 text-lg' : 'text-gray-500'}`}>{i+1}º</span>
                                        <span className="text-white font-medium text-sm truncate max-w-[140px] uppercase">{p.player_name}</span>
                                    </div>
                                    <span className="text-cyan-400 font-bold font-oswald text-sm">R$ {Number(p.prize_won).toLocaleString('pt-BR', { notation: 'compact' })}</span>
                                </div>
                            ))}
                            {rankingData.length === 0 && <p className="text-center text-gray-500 py-6 text-sm">Seja o primeiro a entrar no ranking!</p>}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* MODAL CADASTRO */}
        {showRegistration && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="w-full max-w-sm bg-[#121212] border border-[#333] rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,191,255,0.2)] animate-in zoom-in-95 duration-200">
                    <h2 className="text-2xl md:text-3xl font-bebas text-center mb-2 text-white">VENCEDORES DA SEMANA</h2>
                    <p className="text-gray-400 text-xs text-center mb-6">Ranking reseta toda segunda-feira!</p>
                    
                    <div className="space-y-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nome e Sobrenome</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input 
                                    className="w-full bg-black border border-gray-700 rounded-lg p-3 pl-10 text-white text-sm focus:border-cyan-500 outline-none transition placeholder:text-gray-700"
                                    placeholder="Ex: LeBron James"
                                    value={playerName}
                                    onChange={e => setPlayerName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => handleStartWithRegistration(false)}
                            disabled={checkingName}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 md:py-4 rounded-xl uppercase tracking-wide shadow-lg transform active:scale-95 transition-all text-sm md:text-base flex justify-center items-center gap-2"
                        >
                            {checkingName ? <Loader2 className="animate-spin w-5 h-5"/> : "Jogar e Pontuar 🏆"}
                        </button>
                        <button onClick={() => handleStartWithRegistration(true)} className="w-full text-gray-500 hover:text-white text-xs font-bold uppercase transition p-2">
                            Jogar Apenas por Diversão
                        </button>
                        <button onClick={() => setShowRegistration(false)} className="w-full text-red-500/70 hover:text-red-400 text-[10px] font-bold uppercase transition">
                            Voltar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* LOGO */}
        {settings.logo_url ? (
          <img 
            src={settings.logo_url} 
            alt="Milhão NBA" 
            className="w-[80%] max-w-[280px] md:max-w-md object-contain drop-shadow-[0_0_35px_rgba(255,0,255,0.3)] mb-4 md:mb-6 animate-float"
            priority="true"
          />
        ) : (
          <h1 className="text-5xl md:text-7xl font-bebas text-transparent bg-clip-text bg-gradient-to-b from-[#ff00ff] to-[#00bfff]">MILHÃO NBA</h1>
        )}
        
        <h2 className="text-lg md:text-2xl font-bebas text-white tracking-widest uppercase mb-4">
          O Quiz Mais Difícil do Brasil
        </h2>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
            onClick={() => setShowRegistration(true)} 
            disabled={gameLoading}
            className="bg-gradient-to-r from-[#ff00ff] to-[#00bfff] text-white font-black text-lg md:text-xl py-3 md:py-4 px-8 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(0,191,255,0.4)] font-oswald uppercase tracking-wide w-full flex items-center justify-center gap-2"
            >
            {gameLoading ? <Loader2 className="animate-spin" /> : <><Play className="w-5 h-5 fill-current" /> ENTRAR EM QUADRA</>}
            </button>
            
            <button 
            onClick={fetchRanking}
            className="bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold py-3 px-8 rounded-full transition font-oswald uppercase tracking-wide w-full flex items-center justify-center gap-2 text-sm md:text-base"
            >
             <Trophy className="w-4 h-4 text-yellow-500" /> Maiores Pontuadores
            </button>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-[10px] md:text-xs text-gray-500 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5">
             <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-red-500" /> Anti-Cheat: Não saia da aba
        </div>
      </div>
    );
  }

  // --- TELA DE RESULTADO ---
  if (gameState === 'won' || gameState === 'lost' || gameState === 'stopped') {
    const finalPrize = gameState === 'won' ? PRIZE_LADDER[23] : prize; 
    const isWin = gameState === 'won';
    const isStopped = gameState === 'stopped';
    
    const resultImage = isWin ? settings.victory_image_url : settings.defeat_image_url;

    return (
      <div className="text-center p-6 md:p-10 bg-black/60 rounded-3xl border border-white/10 backdrop-blur-xl max-w-sm md:max-w-lg mx-auto animate-in fade-in zoom-in shadow-2xl w-full">
        
        {resultImage && (
          <img src={resultImage} alt="Resultado" className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 object-cover rounded-full border-4 border-[#ff00ff] shadow-[0_0_30px_rgba(255,0,255,0.3)]" />
        )}

        <h2 className={`text-5xl md:text-6xl font-bebas mb-2 ${isWin ? 'text-[#00ff00]' : 'text-[#ff00ff]'}`}>
            {isWin ? 'LENDÁRIO!' : (gameState === 'stopped' ? 'PAROU!' : 'TOCO!')}
        </h2>
        <p className="text-gray-300 mb-6 font-inter text-sm md:text-base">
            {document.hidden ? "Eliminado pelo sistema Anti-Cheat (saiu da aba)." : (isWin ? "Você zerou o desafio!" : "Não foi dessa vez.")}
        </p>
        <p className="text-sm text-gray-400 mb-1 font-inter uppercase tracking-widest">Prêmio Final</p>
        <p className="text-4xl md:text-5xl font-black text-white mb-8 font-oswald">
          R$ {finalPrize.toLocaleString()}
        </p>
        <button onClick={() => window.location.reload()} className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors font-oswald uppercase tracking-wide w-full md:w-auto">
            Jogar Novamente
        </button>
      </div>
    );
  }

  // --- TELA DO JOGO (GAMEPLAY) ---
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center h-full justify-start md:justify-center px-4 py-8">
        {/* HUD */}
        <div className="w-full flex justify-between items-center mb-6 md:mb-8">
            {/* LADO ESQUERDO: Botão Home + Prêmio */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleBackToMenu}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-300 hover:text-white transition"
                    title="Voltar ao Menu Inicial"
                >
                    <Home className="w-5 h-5" />
                </button>
                <div className="text-left">
                    <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest block">Prêmio</span>
                    <div className="text-2xl md:text-3xl font-black font-oswald text-[#00bfff]">R$ {prize.toLocaleString()}</div>
                </div>
            </div>
            
            {/* LADO DIREITO: Timer */}
            <div className="flex flex-col items-end">
                 <div className={`text-3xl md:text-4xl font-black font-oswald ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</div>
                 <div className="w-24 md:w-32 h-1.5 md:h-2 bg-gray-800 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${timer <= 10 ? 'bg-red-500' : 'bg-[#00ff00]'} transition-all duration-1000 linear`} style={{ width: `${(timer / 30) * 100}%` }} />
                 </div>
            </div>
        </div>

        {/* PERGUNTA */}
         <div className="w-full bg-gradient-to-b from-[#1a1a1a] to-black border border-white/10 rounded-2xl p-6 md:p-10 mb-6 md:mb-8 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff00ff] to-[#00bfff]" />
            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 block">
                Nível {currentQIndex + 1} • {currentQuestion?.category}
            </span>
            <h1 className="text-xl md:text-3xl font-bebas text-white leading-tight md:leading-snug">
                {currentQuestion?.question}
            </h1>
        </div>

        {/* OPÇÕES (DESIGN DUODUNK) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mb-8">
            {currentQuestion?.options.map((opt, idx) => {
                let btnStyle = "bg-white/5 border-white/10 text-gray-300 hover:border-[#ff00ff] hover:text-white"; 
                
                if (selectedOption === idx) {
                    if (answerStatus === 'correct') btnStyle = "bg-[#00bfff] border-[#00bfff] text-black shadow-[0_0_15px_rgba(0,191,255,0.6)] scale-[1.02]";
                    else if (answerStatus === 'wrong') btnStyle = "bg-red-600 border-red-600 text-white";
                } else if (selectedOption !== null) {
                    btnStyle = "bg-black/20 border-white/5 text-gray-600 opacity-50"; 
                }

                return (
                    <button
                        key={idx}
                        onClick={() => onOptionClick(idx)}
                        disabled={selectedOption !== null}
                        className={`p-4 md:p-6 text-left border rounded-xl transition-all duration-200 relative overflow-hidden group font-medium text-sm md:text-lg flex items-center ${btnStyle}`}
                    >
                        <span className={`font-bold mr-3 text-lg md:text-xl ${selectedOption === idx && answerStatus === 'correct' ? 'text-black' : 'text-[#00bfff]'}`}>
                            {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                    </button>
                );
            })}
        </div>

        <button 
            onClick={handleStop}
            disabled={selectedOption !== null}
            className="px-6 py-2 md:px-8 md:py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 rounded-full font-bold uppercase text-xs md:text-sm tracking-widest transition disabled:opacity-0"
        >
            Parar e Levar R$ {prize.toLocaleString()}
        </button>
    </div>
  );
}