import React, { useEffect, useState } from 'react';
import { useNBAApi } from '@/hooks/useNBAApi';

interface Game {
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  location?: string;
  outcome?: string;
}

export const Scoreboard: React.FC = () => {
  const { fetchScores, loading, error } = useNBAApi();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      const data = await fetchScores();
      setGames(data);
    };
    loadGames();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-600">
        <p className="font-semibold">❌ {error}</p>
        <p className="text-sm mt-2">Tente novamente mais tarde</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-4xl mb-4">🏀</p>
        <p className="text-gray-600 text-lg font-semibold">Nenhum jogo agendado para hoje</p>
        <p className="text-gray-500 text-sm mt-2">Volte amanhã para conferir os placares!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">📊</span>
        Placares de Hoje
      </h2>
      
      <div className="space-y-4">
        {games.map((game, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300 border border-gray-200"
          >
            {/* Time Visitante */}
            <div className="flex-1 text-right pr-6">
              <div className="font-bold text-lg text-gray-800">{game.away_team}</div>
              {game.away_score !== undefined && (
                <div className="text-4xl font-black text-pink-600 mt-1">
                  {game.away_score}
                </div>
              )}
            </div>

            {/* VS */}
            <div className="px-4">
              <div className="bg-pink-600 text-white font-bold px-4 py-2 rounded-lg text-sm">
                VS
              </div>
            </div>

            {/* Time Casa */}
            <div className="flex-1 text-left pl-6">
              <div className="font-bold text-lg text-gray-800">{game.home_team}</div>
              {game.home_score !== undefined && (
                <div className="text-4xl font-black text-pink-600 mt-1">
                  {game.home_score}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};