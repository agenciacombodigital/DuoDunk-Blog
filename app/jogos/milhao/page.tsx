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
      {/* Background estilizado (Novo Gradiente Premium) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e]" />

      <div className="relative min-h-screen py-12 px-4 flex flex-col items-center">
        <h1 className="font-bebas text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#00bfff] mb-2 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] select-none">
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