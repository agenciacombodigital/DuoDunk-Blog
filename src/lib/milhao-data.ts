export interface Question {
  id: string;
  level: number;
  sequence_num: number;
  question: string;
  options: string[];
  correct_index: number;
}

export const PRIZE_LADDER = [
  0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, // Nível 1 (1-7)
  10000, 15000, 20000, 30000, 40000, 50000, 60000, // Nível 2 (8-14)
  80000, 100000, 130000, 170000, 220000, 300000, 400000, // Nível 3 (15-21)
  500000, // Nível 3.5 (22)
  1000000 // Nível 4 (23)
];