import Link from 'next/link';
import { NBA_TEAMS } from '@/lib/nbaTeams';
import { Trophy } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Times da NBA - Conferências Leste e Oeste',
  description: 'Explore todos os 30 times da NBA, incluindo informações sobre conferências, divisões e links para notícias de cada equipe.',
  alternates: {
    canonical: 'https://www.duodunk.com.br/times',
  },
};

export default function Times() {
  const eastTeams = NBA_TEAMS.filter(t => t.conference === 'East').sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  const westTeams = NBA_TEAMS.filter(t => t.conference === 'West').sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            🏀 Times da NBA
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore informações detalhadas de todos os 30 times da NBA
          </p>
        </div>

        {/* Conferência Leste */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-blue-600" />
            Conferência Leste
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {eastTeams.map(team => (
              <Link
                key={team.id}
                href={`/times/${team.slug}`}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 text-center transition border border-gray-200 hover:border-gray-300 group"
              >
                <div className="mb-3">
                  <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition overflow-hidden">
                    <img 
                      src={`https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`}
                      alt={team.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const abbr = team.abbreviation.toLowerCase();
                        
                        // Lista de URLs para tentar em ordem
                        const alternatives = [
                          `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr}.png&h=200&w=200`,
                          `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'uta' ? 'utah' : abbr}.png`,
                          `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'nop' ? 'no' : abbr}.png`
                        ];
                        
                        // Encontra a URL atual na lista de alternativas para tentar a próxima
                        const currentSrcIndex = alternatives.findIndex(src => img.src.includes(src));
                        const nextIndex = currentSrcIndex + 1;

                        if (nextIndex < alternatives.length) {
                          img.src = alternatives[nextIndex];
                        } else {
                          // Se todas falharem, mostra abreviação
                          img.style.display = 'none';
                          if (img.parentElement) {
                            img.parentElement.innerHTML = `<span class="text-3xl font-black text-gray-400">${team.abbreviation}</span>`;
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-pink-600 transition">
                  {team.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{team.division}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Conferência Oeste */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-red-600" />
            Conferência Oeste
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {westTeams.map(team => (
              <Link
                key={team.id}
                href={`/times/${team.slug}`}
                className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 text-center transition border border-gray-200 hover:border-gray-300 group"
              >
                <div className="mb-3">
                  <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition overflow-hidden">
                    <img 
                      src={`https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`}
                      alt={team.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const img = e.currentTarget;
                        const abbr = team.abbreviation.toLowerCase();
                        
                        // Lista de URLs para tentar em ordem
                        const alternatives = [
                          `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr}.png&h=200&w=200`,
                          `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'uta' ? 'utah' : abbr}.png`,
                          `https://a.espncdn.com/i/teamlogos/nba/500/${abbr === 'nop' ? 'no' : abbr}.png`
                        ];
                        
                        // Encontra a URL atual na lista de alternativas para tentar a próxima
                        const currentSrcIndex = alternatives.findIndex(src => img.src.includes(src));
                        const nextIndex = currentSrcIndex + 1;

                        if (nextIndex < alternatives.length) {
                          img.src = alternatives[nextIndex];
                        } else {
                          // Se todas falharem, mostra abreviação
                          img.style.display = 'none';
                          if (img.parentElement) {
                            img.parentElement.innerHTML = `<span class="text-3xl font-black text-gray-400">${team.abbreviation}</span>`;
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-pink-600 transition">
                  {team.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{team.division}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}