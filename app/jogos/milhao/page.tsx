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
        {/* Título e Subtítulo removidos para usar apenas o logo do MilhaoInterface */}
        <MilhaoInterface />
      </div>
    </div>
  );
}