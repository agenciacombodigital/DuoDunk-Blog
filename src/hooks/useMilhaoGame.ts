import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, PRIZE_LADDER } from '@/lib/milhao-data';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const MAX_QUESTIONS = 23;
const INITIAL_TIME = 45;
const MAX_CHEAT_ATTEMPTS = 3;

export function useMilhaoGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost' | 'paused' | 'stopped'>('start');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [prize, setPrize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(INITIAL_TIME);
  const [cheatAttempts, setCheatAttempts] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef(true); // Para controle de trapaça

  // --- LÓGICA ESTRONDOSA DE SORTEIO ---
  const fetchUniqueQuestions = async (level: number, count: number, seenIds: string[]) => {
    // Tenta buscar perguntas que o usuário NUNCA viu
    const { data, error } = await supabase.rpc('get_random_questions', {
      p_level: level,
      p_limit: count,
      p_exclude_ids: seenIds
    });

    if (error) {
      console.error('Erro no RPC:', error);
      return [];
    }

    // Se não encontrou o suficiente (ex: usuário já viu todas), busca sem filtro (reset parcial)
    if (!data || data.length < count) {
      console.warn(`Nível ${level}: Não há perguntas únicas suficientes. Resetando memória local para este nível.`);
      
      // Tenta buscar sem exclusão (resetando a memória local para este nível)
      const { data: fallbackData } = await supabase.rpc('get_random_questions', {
        p_level: level,
        p_limit: count,
        p_exclude_ids: [] // Busca sem exclusão
      });
      
      // Se o fallback funcionar, retornamos e o startGame fará a limpeza do localStorage
      return fallbackData || [];
    }

    return data;
  };

  const startGame = useCallback(async () => {
    setLoading(true);
    
    // 1. Recuperar memória do usuário
    const storedSeen = localStorage.getItem('milhao_seen_ids');
    let seenIds: string[] = storedSeen ? JSON.parse(storedSeen) : [];
    let shouldClearAll = false;

    try {
        // 2. Buscar perguntas inteligentes por nível
        const easy = await fetchUniqueQuestions(1, 7, seenIds);
        const medium = await fetchUniqueQuestions(2, 8, seenIds);
        const hard = await fetchUniqueQuestions(3, 7, seenIds);
        const million = await fetchUniqueQuestions(4, 1, seenIds);

        const selectedQuestions = [...easy, ...medium, ...hard, ...million].filter(q => q.question && q.options && q.options.length === 4);

        if (selectedQuestions.length === MAX_QUESTIONS) {
            setQuestions(selectedQuestions);
            
            // 3. Atualizar memória (marcar as novas como vistas)
            const newSeenIds = [...seenIds, ...selectedQuestions.map(q => q.id)];
            localStorage.setItem('milhao_seen_ids', JSON.stringify(newSeenIds));

            setGameState('playing');
            setCurrentQIndex(0);
            setPrize(PRIZE_LADDER[0]);
            setTimer(INITIAL_TIME);
            setCheatAttempts(0);
        } else if (selectedQuestions.length > 0) {
            // Se não encontrou 23, mas encontrou algumas (provavelmente porque o banco está pequeno)
            toast.error(`Não há perguntas suficientes cadastradas! (Encontradas: ${selectedQuestions.length}/${MAX_QUESTIONS})`);
        } else {
            // Se não encontrou NENHUMA, o usuário viu todas as perguntas do banco.
            shouldClearAll = true;
            toast.warning("Parabéns! Você zerou o banco de perguntas. Reiniciando o ciclo.");
            
            // Tenta buscar novamente após a limpeza
            const easyFallback = await fetchUniqueQuestions(1, 7, []);
            const mediumFallback = await fetchUniqueQuestions(2, 8, []);
            const hardFallback = await fetchUniqueQuestions(3, 7, []);
            const millionFallback = await fetchUniqueQuestions(4, 1, []);
            
            const fallbackQuestions = [...easyFallback, ...mediumFallback, ...hardFallback, ...millionFallback].filter(q => q.question && q.options && q.options.length === 4);
            
            if (fallbackQuestions.length === MAX_QUESTIONS) {
                setQuestions(fallbackQuestions);
                const newSeenIds = fallbackQuestions.map(q => q.id);
                localStorage.setItem('milhao_seen_ids', JSON.stringify(newSeenIds));
                setGameState('playing');
                setCurrentQIndex(0);
                setPrize(PRIZE_LADDER[0]);
                setTimer(INITIAL_TIME);
                setCheatAttempts(0);
            } else {
                toast.error(`Falha crítica: Banco de perguntas vazio ou incompleto. Encontradas: ${fallbackQuestions.length}/${MAX_QUESTIONS}`);
            }
        }
    } catch (e) {
        console.error("Erro ao iniciar o jogo:", e);
        toast.error("Falha ao iniciar o jogo.");
    } finally {
        if (shouldClearAll) {
            localStorage.removeItem('milhao_seen_ids');
        }
        setLoading(false);
    }
  }, []);

  // --- LÓGICA DO TIMER ---
  useEffect(() => {
    if (gameState === 'playing') {
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setGameState('lost'); // Tempo acabou
                    toast.error("Tempo esgotado!", { description: `Você parou em R$ ${prize.toLocaleString('pt-BR')}.` });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, prize]);

  // Resetar timer ao mudar de pergunta
  useEffect(() => {
      if (gameState === 'playing') {
        setTimer(INITIAL_TIME);
      }
  }, [currentQIndex, gameState]);

  // --- LÓGICA DE TRAPAÇA (VISIBILIDADE DA ABA) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === 'playing') {
        visibilityRef.current = false;
        setCheatAttempts(prev => prev + 1);
        setGameState('paused');
        toast.warning("Trapaça detectada!", { description: `Você saiu da aba. Tentativas: ${cheatAttempts + 1}/${MAX_CHEAT_ATTEMPTS}` });
        
        if (cheatAttempts + 1 >= MAX_CHEAT_ATTEMPTS) {
            setGameState('lost');
            toast.error("Trapaça máxima atingida!", { description: "Você foi desclassificado." });
        }
      } else if (!document.hidden && gameState === 'paused') {
        visibilityRef.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameState, cheatAttempts]);


  // --- LÓGICA DE RESPOSTA ---
  const handleAnswer = (selectedIndex: number) => {
    const currentQ = questions[currentQIndex];
    if (selectedIndex === currentQ.correct_index) {
      const nextIndex = currentQIndex + 1;
      if (nextIndex >= questions.length) {
        setPrize(PRIZE_LADDER[MAX_QUESTIONS]); // 1 Milhão
        setGameState('won');
        confetti({ particleCount: 200, spread: 70, zIndex: 9999 });
        toast.success("CAMPEÃO!", { description: "Você ganhou R$ 1.000.000!" });
      } else {
        setPrize(PRIZE_LADDER[nextIndex]);
        setCurrentQIndex(nextIndex);
        toast.success("Resposta Correta!", { duration: 1000 });
      }
    } else {
      setGameState('lost');
      toast.error("Resposta Incorreta!", { description: `Você parou em R$ ${prize.toLocaleString('pt-BR')}.` });
    }
  };

  const handleStop = () => {
      setGameState('stopped');
      toast.info("Você parou o jogo.", { description: `Prêmio garantido: R$ ${prize.toLocaleString('pt-BR')}.` });
  };
  
  // As funções de ajuda foram removidas.

  return { 
      gameState, 
      setGameState, 
      currentQuestion: questions[currentQIndex], 
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
      // Retornamos funções dummy para manter a compatibilidade da interface, se necessário,
      // mas o ideal é remover as chamadas no componente de interface.
      useFiftyFifty: () => { toast.error("Ajuda desativada."); return null; },
      useSkip: () => { toast.error("Ajuda desativada."); },
      useCards: () => { toast.error("Ajuda desativada."); },
      useRookies: () => { toast.error("Ajuda desativada."); },
      lifelines: { skip: 0, fifty: false, cards: false, rookies: false },
  };
}