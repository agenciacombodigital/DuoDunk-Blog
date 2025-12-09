import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, PRIZE_LADDER } from '@/lib/milhao-data';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function useMilhaoGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost' | 'paused' | 'stopped'>('start');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [prize, setPrize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ajudas
  const [lifelines, setLifelines] = useState({ 
    skip: 3,      
    fifty: true,  
    cards: true,  
    rookies: true 
  });

  // Carregar Perguntas (Lógica de Sorteio)
  const startGame = useCallback(async () => {
    setLoading(true);
    setGameState('start');
    
    // Busca um pool grande de perguntas para sortear
    // Nível 1
    const { data: easy } = await supabase.from('milhao_questions').select('*').eq('level', 1).limit(50);
    // Nível 2
    const { data: medium } = await supabase.from('milhao_questions').select('*').eq('level', 2).limit(50);
    // Nível 3
    const { data: hard } = await supabase.from('milhao_questions').select('*').eq('level', 3).limit(50);
    // Nível 4
    const { data: million } = await supabase.from('milhao_questions').select('*').eq('level', 4).limit(10);

    if (easy && medium && hard && million) {
        // Embaralha e seleciona a quantidade certa
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
        
        const selectedQuestions = [
            ...shuffle(easy).slice(0, 7),   // 7 Fáceis
            ...shuffle(medium).slice(0, 8), // 8 Médias
            ...shuffle(hard).slice(0, 7),   // 7 Difíceis
            ...shuffle(million).slice(0, 1) // 1 Milhão
        ];

        if (selectedQuestions.length === 23) {
            setQuestions(selectedQuestions);
            setGameState('playing');
            setCurrentQIndex(0);
            setPrize(0);
            setTimer(45);
            setLifelines({ skip: 3, fifty: true, cards: true, rookies: true });
        } else {
            toast.error(`Erro: Banco de perguntas incompleto. Encontradas: ${selectedQuestions.length}/23.`);
        }
    } else {
      toast.error("Erro de conexão com o banco.");
    }
    setLoading(false);
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setGameState('lost'); // Tempo acabou
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, currentQIndex]);

  // Resetar timer ao mudar de pergunta
  useEffect(() => {
      setTimer(45);
  }, [currentQIndex]);

  const handleAnswer = (selectedIndex: number) => {
    const currentQ = questions[currentQIndex];
    if (selectedIndex === currentQ.correct_index) {
      if (currentQIndex + 1 >= questions.length) {
        setPrize(1000000);
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

  const handleStop = () => {
      setGameState('stopped');
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
      timer 
  };
}