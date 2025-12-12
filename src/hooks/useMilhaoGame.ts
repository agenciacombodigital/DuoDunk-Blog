import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, PRIZE_LADDER } from '@/lib/milhao-data';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

const MAX_QUESTIONS = 23;
const INITIAL_TIME = 30; // REDUZIDO PARA 30 SEGUNDOS
// O sistema anti-cheat foi movido para o page.tsx, então removemos o MAX_CHEAT_ATTEMPTS

export function useMilhaoGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost' | 'paused' | 'stopped'>('start');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [prize, setPrize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(INITIAL_TIME);
  
  // Novas Ajudas
  const [lifelines, setLifelines] = useState({ 
    scout: true,   // Remove 2 erradas + Dica
    timeout: true, // Para o tempo
    challenge: true // Segunda chance
  });
  const [challengeActive, setChallengeActive] = useState(false); // Estado para a ajuda 'Challenge'
  const [timerFrozen, setTimerFrozen] = useState(false); // Estado para 'Timeout'
  const [scoutResult, setScoutResult] = useState<{ eliminated: number[], certainty: number } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // A lógica de visibilidade foi removida daqui, pois está no page.tsx

  // --- LÓGICA ESTRONDOSA DE SORTEIO (Mantida a mesma) ---
  const fetchUniqueQuestions = async (level: number, count: number, seenIds: string[]) => {
    const { data, error } = await supabase.rpc('get_random_questions', {
      p_level: level,
      p_limit: count,
      p_exclude_ids: seenIds
    });

    if (error) {
      console.error('Erro no RPC:', error);
      return [];
    }

    if (!data || data.length < count) {
      console.warn(`Nível ${level}: Não há perguntas únicas suficientes. Resetando memória local para este nível.`);
      const { data: fallbackData } = await supabase.rpc('get_random_questions', {
        p_level: level,
        p_limit: count,
        p_exclude_ids: []
      });
      return fallbackData || [];
    }

    return data;
  };

  const startGame = useCallback(async () => {
    setLoading(true);
    
    const storedSeen = localStorage.getItem('milhao_seen_ids');
    let seenIds: string[] = storedSeen ? JSON.parse(storedSeen) : [];
    let shouldClearAll = false;

    try {
        const easy = await fetchUniqueQuestions(1, 7, seenIds);
        const medium = await fetchUniqueQuestions(2, 8, seenIds);
        const hard = await fetchUniqueQuestions(3, 7, seenIds);
        const million = await fetchUniqueQuestions(4, 1, seenIds);

        const selectedQuestions = [...easy, ...medium, ...hard, ...million].filter(q => q.question && q.options && q.options.length === 4);

        if (selectedQuestions.length === MAX_QUESTIONS) {
            setQuestions(selectedQuestions);
            
            const newSeenIds = [...seenIds, ...selectedQuestions.map(q => q.id)];
            localStorage.setItem('milhao_seen_ids', JSON.stringify(newSeenIds));

            setGameState('playing');
            setCurrentQIndex(0);
            setPrize(PRIZE_LADDER[0]);
            setTimer(INITIAL_TIME);
            setLifelines({ scout: true, timeout: true, challenge: true });
            setChallengeActive(false);
            setTimerFrozen(false);
            setScoutResult(null);
        } else if (selectedQuestions.length > 0) {
            toast.error(`Não há perguntas suficientes cadastradas! (Encontradas: ${selectedQuestions.length}/${MAX_QUESTIONS})`);
        } else {
            shouldClearAll = true;
            toast.warning("Parabéns! Você zerou o banco de perguntas. Reiniciando o ciclo.");
            
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
                setLifelines({ scout: true, timeout: true, challenge: true });
                setChallengeActive(false);
                setTimerFrozen(false);
                setScoutResult(null);
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
    if (gameState === 'playing' && !timerFrozen) {
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
  }, [gameState, prize, timerFrozen]);

  // Resetar timer ao mudar de pergunta
  useEffect(() => {
      if (gameState === 'playing') {
        setTimer(INITIAL_TIME);
        setTimerFrozen(false);
        setScoutResult(null);
      }
  }, [currentQIndex, gameState]);


  // --- LÓGICA DE RESPOSTA ---
  const handleAnswer = (selectedIndex: number) => {
    const currentQ = questions[currentQIndex];
    
    if (selectedIndex === currentQ.correct_index) {
      // ACERTOU
      setChallengeActive(false); // Reseta o challenge se usou
      if (currentQIndex + 1 >= questions.length) {
        setPrize(PRIZE_LADDER[MAX_QUESTIONS]); // 1 Milhão
        setGameState('won');
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
        toast.success("CAMPEÃO!", { description: "Você ganhou R$ 1.000.000!" });
      } else {
        setPrize(PRIZE_LADDER[currentQIndex + 1]);
        setCurrentQIndex(prev => prev + 1);
        toast.success("Resposta Correta!", { duration: 1000 });
      }
    } else {
      // ERROU
      if (challengeActive) {
        // Se ativou o 'Desafio do Técnico', salva a vida
        toast.warning("DESAFIO BEM SUCEDIDO! A resposta estava errada. Tente outra opção.");
        setChallengeActive(false); // Consome a ajuda
        // Não elimina, apenas avisa
      } else {
        setGameState('lost');
        toast.error("Resposta Incorreta!", { description: `Você parou em R$ ${prize.toLocaleString('pt-BR')}.` });
      }
    }
  };

  const handleStop = () => {
      setGameState('stopped');
      toast.info("Você parou o jogo.", { description: `Prêmio garantido: R$ ${prize.toLocaleString('pt-BR')}.` });
  };
  
  // --- FUNÇÕES DAS AJUDAS ---
  const activateTimeout = () => {
    if (!lifelines.timeout || timerFrozen) return;
    setTimerFrozen(true);
    setLifelines(prev => ({...prev, timeout: false}));
    toast.info("TEMPO TÉCNICO! O relógio está congelado por 20 segundos.");
    setTimeout(() => {
        setTimerFrozen(false);
        toast.info("O jogo recomeçou! O tempo está correndo.");
    }, 20000); // 20s de pause
  };

  const activateChallenge = () => {
    if (!lifelines.challenge || challengeActive) return;
    setChallengeActive(true);
    setLifelines(prev => ({...prev, challenge: false}));
    toast.warning("DESAFIO ATIVADO! Você tem uma chance extra nesta pergunta.");
  };
  
  const activateScout = () => {
    if (!lifelines.scout || scoutResult) return;
    
    const currentQ = questions[currentQIndex];
    const correctIndex = currentQ.correct_index;
    const allOptions = [0, 1, 2, 3];
    
    // Encontra as opções erradas
    const incorrectOptions = allOptions.filter(i => i !== correctIndex);
    
    // Sorteia 2 para eliminar
    const eliminated = [];
    while (eliminated.length < 2) {
        const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
        const optionToEliminate = incorrectOptions[randomIndex];
        if (!eliminated.includes(optionToEliminate)) {
            eliminated.push(optionToEliminate);
        }
    }
    
    // Define a certeza (maior o nível, menor a certeza)
    const certainty = 95 - (currentQ.level * 10) + Math.floor(Math.random() * 5); // Ex: Nível 4 = 55-60%
    
    setScoutResult({ eliminated, certainty });
    setLifelines(prev => ({...prev, scout: false}));
    toast.info("O SCOUT CHEGOU! Duas opções foram eliminadas. Analise a dica de certeza.");
  };


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
      timerFrozen,
      cheatAttempts: 0, // Removido o contador de trapaça
      currentQIndex,
      questions,
      MAX_QUESTIONS,
      INITIAL_TIME,
      lifelines,
      scoutResult,
      challengeActive,
      activateTimeout,
      activateChallenge,
      activateScout,
  };
}