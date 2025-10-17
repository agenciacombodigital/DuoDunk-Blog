import React, { useEffect, useState } from 'react';
import { useNBAApi } from '@/hooks/useNBAApi';

interface Game {
  date: string;
  time?: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
}

export const Calendar: React.FC = () => {
  const { fetchCalendar, loading, error } = useNBAApi();
  const [games, setGames] = useState<Game[]>([]);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const loadGames = async () => {
      const data = await fetchCalendar(days);
      setGames(data);
    };
    loadGames();
  }, [days]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
        ❌ {error}
      </div>
    );
  }

  // Agrupar jogos por data
  const gamesByDate = games.reduce((acc, game) => {
    if (!acc[game.date]) {
      acc[game.date] = [];
    }
    acc[game.date].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">📅</span>
          Próximos Jogos
        </h2>
        
        {/* Filtro de dias */}
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                days === d
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      {Object.keys(gamesByDate).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🏀</p>
          <p className="text-gray-600 font-semibold">Nenhum jogo agendado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gamesByDate).map(([date, dateGames]) => (
            <div key={date}>
              {/* Cabeçalho da data */}
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold px-4 py-2 rounded-lg mb-3">
                {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long'
                })}
              </div>

              {/* Jogos do dia */}
              <div className="space-y-2">
                {dateGames.map((game, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-sm font-semibold text-gray-500 w-16">
                        {game.time || '--:--'}
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-bold text-gray-800">
                          {game.away_team}
                        </span>
                        <span className="text-gray-400 font-bold">@</span>
                        <span className="font-bold text-gray-800">
                          {game.home_team}
                        </span>
                      </div>
                    </div>

                    {game.home_score !== undefined && (
                      <div className="flex items-center gap-3 text-lg font-bold">
                        <span className="text-pink-600">{game.away_score}</span>
                        <span className="text-gray-400">-</span>
                        <span className="text-pink-600">{game.home_score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};