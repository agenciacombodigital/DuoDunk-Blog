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

  // Ajudas
  const [lifelines, setLifelines] = useState({ 
    skip: 3,      
    fifty: true,  
    cards: true,  
    rookies: true 
  });

  // --- LÓGICA DE SORTEIO ---
  const startGame = useCallback(async () => {
    setLoading(true);
    setGameState('start');
    
    try {
        // Busca um pool grande de perguntas para sortear
        const { data: easy } = await supabase.from('milhao_questions').select('*').eq('level', 1).limit(50);
        const { data: medium } = await supabase.from('milhao_questions').select('*').eq('level', 2).limit(50);
        const { data: hard } = await supabase.from('milhao_questions').select('*').eq('level', 3).limit(50);
        const { data: million } = await supabase.from('milhao_questions').select('*').eq('level', 4).limit(10);

        if (easy && medium && hard && million) {
            const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
            
            const selectedQuestions = [
                ...shuffle(easy).slice(0, 7),   // 7 Fáceis
                ...shuffle(medium).slice(0, 8), // 8 Médias
                ...shuffle(hard).slice(0, 7),   // 7 Difíceis
                ...shuffle(million).slice(0, 1) // 1 Milhão
            ].filter(q => q.question && q.options && q.options.length === 4); // Filtra inválidas

            if (selectedQuestions.length === MAX_QUESTIONS) {
                setQuestions(selectedQuestions);
                setGameState('playing');
                setCurrentQIndex(0);
                setPrize(PRIZE_LADDER[0]); // Começa com 0
                setTimer(INITIAL_TIME);
                setLifelines({ skip: 3, fifty: true, cards: true, rookies: true });
                setCheatAttempts(0);
            } else {
                toast.error(`Erro: Banco de perguntas incompleto. Encontradas: ${selectedQuestions.length}/${MAX_QUESTIONS}.`);
            }
        } else {
          toast.error("Erro de conexão com o banco.");
        }
    } catch (e) {
        console.error("Erro ao carregar perguntas:", e);
        toast.error("Falha ao carregar perguntas do Quiz.");
    } finally {
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
  
  // --- LÓGICA DAS AJUDAS ---
  const useFiftyFifty = () => {
    if (!lifelines.fifty || !currentQuestion) return null;
    
    setLifelines(prev => ({ ...prev, fifty: false }));
    toast.info("Ajuda 50/50 usada!", { description: "Duas opções incorretas foram removidas." });

    const correctIndex = currentQuestion.correct_index;
    const incorrectOptions = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Remove duas opções incorretas aleatoriamente
    const optionsToRemove = incorrectOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    
    return optionsToRemove;
  };
  
  const useSkip = () => {
    if (lifelines.skip <= 0 || !currentQuestion || currentQIndex + 1 >= questions.length) return;
    
    setLifelines(prev => ({ ...prev, skip: prev.skip - 1 }));
    toast.info("Ajuda Pular usada!", { description: "Pulando para a próxima pergunta." });
    
    const nextIndex = currentQIndex + 1;
    setPrize(PRIZE_LADDER[nextIndex]);
    setCurrentQIndex(nextIndex);
  };
  
  const useCards = () => {
    if (!lifelines.cards || !currentQuestion) return;
    setLifelines(prev => ({ ...prev, cards: false }));
    toast.info("Ajuda Cartas usada!", { description: "Aguarde a resposta da comunidade." });
    // Lógica de delay simulado para a resposta da comunidade
  };
  
  const useRookies = () => {
    if (!lifelines.rookies || !currentQuestion) return;
    setLifelines(prev => ({ ...prev, rookies: false }));
    toast.info("Ajuda Rookies usada!", { description: "Aguarde a opinião dos novatos." });
    // Lógica de delay simulado para a resposta dos novatos
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
      lifelines, 
      setLifelines,
      timer,
      cheatAttempts,
      currentQIndex,
      questions,
      useFiftyFifty,
      useSkip,
      useCards,
      useRookies,
      MAX_QUESTIONS,
      INITIAL_TIME,
  };
}