import CalendarioNBA from '@/components/CalendarioNBA';
import { Calendar } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendário NBA - Jogos, Horários e Transmissões',
  description: 'Confira o calendário completo da NBA, incluindo jogos de hoje e da semana, horários de Brasília e onde assistir cada partida.',
  alternates: {
    canonical: 'https://www.duodunk.com.br/calendario',
  },
};

export default function Calendario() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calendar className="w-10 h-10 text-pink-600" />
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900">
              Calendário NBA
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Confira os jogos de hoje e da semana, horários e transmissões.
          </p>
        </div>
        
        <CalendarioNBA />
      </div>
    </div>
  );
}