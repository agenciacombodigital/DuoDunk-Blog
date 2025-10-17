import { Scoreboard } from '@/components/Scoreboard';
import { Standings } from '@/components/Standings';
import { Calendar } from '@/components/Calendar';
import { PlayerSearch } from '@/components/PlayerSearch';
import { Leaders } from '@/components/Leaders';

export default function Estatisticas() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-black mb-4 flex items-center justify-center gap-4">
            <span className="text-6xl">🏀</span>
            Estatísticas NBA
          </h1>
          <p className="text-xl opacity-90">
            Acompanhe placares, classificação, calendário e muito mais!
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        
        {/* Placares de Hoje */}
        <section>
          <Scoreboard />
        </section>

        {/* Grid: Calendário + Líderes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Calendar />
          <Leaders />
        </section>

        {/* Classificação */}
        <section>
          <Standings />
        </section>

        {/* Buscar Jogador */}
        <section>
          <PlayerSearch />
        </section>

      </div>
    </div>
  );
}