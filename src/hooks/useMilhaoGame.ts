import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, PRIZE_LADDER } from '@/lib/milhao-data';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Tipagem para a tabela milhao_questions
interface MilhaoQuestion {
  id: string;
  level: number;
  sequence_num: number;
  question: string;
  options: string[];
  correct_index: number;
}

export function useMilhaoGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost' | 'paused'>('start');
  const [questions, setQuestions] = useState<MilhaoQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [prize, setPrize] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Ajudas
  const [lifelines, setLifelines] = useState({ 
    skip: 3,      // 3 Pulos
    fifty: true,  // 50/50
    cards: true,  // Cartas
    rookies: true // Universitários (Rookies)
  });

  // Anti-Trapaça
  const [cheatAttempts, setCheatAttempts] = useState(0);

  // Carregar Perguntas
  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      // Busca perguntas ordenadas por level e sequence_num
      const { data, error } = await supabase
        .from('milhao_questions') // Nome da tabela no banco
        .select('*')
        .order('level', { ascending: true })
        .order('sequence_num', { ascending: true })
        .limit(24); // Limita para um jogo completo
      
      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
        setGameState('playing');
        setCurrentQIndex(0);
        setPrize(PRIZE_LADDER[0]); // Começa com 0
        setLifelines({ skip: 3, fifty: true, cards: true, rookies: true });
        setCheatAttempts(0);
      } else {
        toast.error("Erro ao carregar perguntas. Verifique o banco de dados.");
      }
    } catch (e: any) {
        console.error("Erro ao iniciar jogo:", e.message);
        toast.error("Erro ao carregar perguntas: " + e.message);
    } finally {
        setLoading(false);
    }
  }, []);

  // Sistema Anti-Trapaça
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatAttempts(prev => {
          const newCount = prev + 1;
          if (newCount === 1) {
            setGameState('paused');
            toast.warning("⚠️ AVISO: Não saia da aba! Jogo pausado.");
          } else if (newCount === 2) {
            toast.error("🚨 ÚLTIMA CHANCE: Se sair de novo, será eliminado!");
          } else {
            setGameState('lost');
            toast.error("❌ ELIMINADO por suspeita de trapaça!");
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameState]);

  const handleAnswer = (selectedIndex: number) => {
    const currentQ = questions[currentQIndex];
    if (selectedIndex === currentQ.correct_index) {
      if (currentQIndex + 1 >= questions.length) {
        setPrize(PRIZE_LADDER[questions.length]);
        setGameState('won');
        confetti({ particleCount: 200, spread: 70, zIndex: 9999 });
      } else {
        setPrize(PRIZE_LADDER[currentQIndex + 1]);
        setCurrentQIndex(prev => prev + 1);
      }
    } else {
      setGameState('lost');
    }
  };

  const useFiftyFifty = () => {
    if (!lifelines.fifty || !questions[currentQIndex]) return null;
    setLifelines(prev => ({ ...prev, fifty: false }));
    
    const correctIndex = questions[currentQIndex].correct_index;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Embaralha e pega 2 erradas para esconder
    return wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
  };
  
  const useSkip = () => {
    if (lifelines.skip <= 0 || !questions[currentQIndex]) return;
    setLifelines(prev => ({ ...prev, skip: prev.skip - 1 }));
    
    const nextIndex = currentQIndex + 1;
    if (nextIndex >= questions.length) {
        // Se for a última, não pode pular, mas o botão deve estar desabilitado
        toast.warning("Não é possível pular a última pergunta!");
        return;
    }
    
    setPrize(PRIZE_LADDER[nextIndex]);
    setCurrentQIndex(nextIndex);
    toast.info("Pergunta pulada! 🏃‍♂️");
  };
  
  // Placeholder para outras ajudas (apenas para a interface)
  const useCards = () => {
    if (!lifelines.cards) return;
    setLifelines(prev => ({ ...prev, cards: false }));
    toast.info("Ajuda 'Cartas' usada! (Implementação futura)");
  };
  
  const useRookies = () => {
    if (!lifelines.rookies) return;
    setLifelines(prev => ({ ...prev, rookies: false }));
    toast.info("Ajuda 'Rookies' usada! (Implementação futura)");
  };

  const currentQuestionData = questions[currentQIndex];

  return { 
    gameState, 
    setGameState, 
    currentQuestion: currentQuestionData, 
    prize, 
    loading, 
    startGame, 
    handleAnswer, 
    useFiftyFifty,
    useSkip,
    useCards,
    useRookies,
    lifelines,
    cheatAttempts
  };
}