import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Question, PRIZE_LADDER } from '@/lib/milhao-data';
import confetti from 'canvas-confetti';

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
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [questions, setQuestions] = useState<MilhaoQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [prize, setPrize] = useState(0);
  const [lifelines, setLifelines] = useState({ fifty: true });
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      // Busca perguntas ordenadas por level e sequence_num
      const { data, error } = await supabase
        .from('milhao_questions') // Nome da tabela no banco
        .select('*')
        .order('level', { ascending: true })
        .order('sequence_num', { ascending: true });
      
      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
        setGameState('playing');
        setCurrentQIndex(0);
        setPrize(PRIZE_LADDER[0]); // Começa com 0
        setLifelines({ fifty: true });
      } else {
          alert("Erro ao carregar perguntas. Verifique o banco de dados.");
      }
    } catch (e: any) {
        console.error("Erro ao iniciar jogo:", e.message);
        alert("Erro ao carregar perguntas: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    const currentQ = questions[currentQIndex];
    
    if (selectedIndex === currentQ.correct_index) {
      // Resposta Correta
      const nextIndex = currentQIndex + 1;
      
      if (nextIndex >= questions.length) {
        // Ganhou o prêmio máximo
        setPrize(PRIZE_LADDER[questions.length]);
        setGameState('won');
        confetti({ particleCount: 200, spread: 70, zIndex: 9999 });
      } else {
        // Avança para a próxima pergunta e atualiza o prêmio
        setPrize(PRIZE_LADDER[nextIndex]);
        setCurrentQIndex(nextIndex);
      }
    } else {
      // Resposta Incorreta
      setGameState('lost');
    }
  };

  const useFiftyFifty = () => {
    if (!lifelines.fifty || !currentQuestion) return null;
    setLifelines(prev => ({ ...prev, fifty: false }));
    
    const correctIndex = currentQuestion.correct_index;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    // Embaralha e pega 2 erradas para esconder
    return wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
  };
  
  // O hook retorna a pergunta atual
  const currentQuestionData = questions[currentQIndex];

  return { 
    gameState, 
    currentQuestion: currentQuestionData, 
    prize, 
    loading, 
    startGame, 
    handleAnswer, 
    useFiftyFifty, 
    lifelines 
  };
}