import React, { useEffect, useState } from 'react';
import { useNBAApi } from '@/hooks/useNBAApi';

interface Standing {
  team: string;
  wins: number;
  losses: number;
  win_percentage: number;
}

export const Standings: React.FC = () => {
  const { fetchStandings, loading } = useNBAApi();
  const [standings, setStandings] = useState<{
    eastern: Standing[];
    western: Standing[];
  }>({ eastern: [], western: [] });

  useEffect(() => {
    const loadStandings = async () => {
      const data = await fetchStandings();
      setStandings(data);
    };
    loadStandings();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  const renderConference = (title: string, emoji: string, teams: Standing[]) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-5">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <span>{emoji}</span>
          {title}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-bold text-gray-600">#</th>
              <th className="text-left py-3 px-4 font-bold text-gray-600">Time</th>
              <th className="text-center py-3 px-3 font-bold text-gray-600">V</th>
              <th className="text-center py-3 px-3 font-bold text-gray-600">D</th>
              <th className="text-center py-3 px-3 font-bold text-gray-600">%</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr 
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className={`font-bold text-lg ${index < 6 ? 'text-green-600' : 'text-gray-600'}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="py-4 px-4 font-bold text-gray-800">{team.team}</td>
                <td className="py-4 px-3 text-center text-green-600 font-bold">{team.wins}</td>
                <td className="py-4 px-3 text-center text-red-600 font-bold">{team.losses}</td>
                <td className="py-4 px-3 text-center font-bold text-gray-700">
                  {(team.win_percentage * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-gray-800 mb-2">
          🏆 Classificação NBA
        </h2>
        <p className="text-gray-600">Temporada 2024-2025</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderConference('Conferência Leste', '🌟', standings.eastern)}
        {renderConference('Conferência Oeste', '⭐', standings.western)}
      </div>
    </div>
  );
};