export interface Question {
  id: string;
  level: number;
  sequence_num: number;
  question: string;
  options: string[];
  correct_index: number;
}

export const PRIZE_LADDER = [
  0, 1000, 2000, 3000, 4000, 5000, // Nível 1 (Perguntas 1-5)
  10000, 20000, 30000, 40000, 50000, // Nível 2 (Perguntas 6-10)
  100000, 200000, 300000, 400000, 500000, // Nível 3 (Perguntas 11-15)
  1000000 // O Grande Prêmio (Pergunta 16)
];