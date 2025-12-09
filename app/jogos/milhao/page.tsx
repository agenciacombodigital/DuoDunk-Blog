import MilhaoInterface from '@/components/games/MilhaoInterface';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Milhão NBA - O Quiz | Duo Dunk',
  description: 'Teste seu conhecimento sobre a NBA e concorra ao prêmio máximo no quiz Milhão NBA.',
  alternates: {
    canonical: 'https://www.duodunk.com.br/jogos/milhao',
  },
};

export default function MilhaoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Background estilizado */}
      <div className="absolute inset-0 bg-[url('/images/bg-quiz.jpg')] bg-cover bg-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

      <div className="relative min-h-screen py-12 px-4 flex flex-col items-center">
        <h1 className="font-bebas text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-2 drop-shadow-sm select-none">
          MILHÃO NBA
        </h1>
        <p className="text-gray-400 mb-12 font-inter font-medium tracking-wide">
           O DESAFIO DEFINITIVO
        </p>
        <MilhaoInterface />
      </div>
    </div>
  );
}