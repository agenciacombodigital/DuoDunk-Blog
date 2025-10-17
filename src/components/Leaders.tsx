import React, { useEffect, useState } from 'react';
import { useNBAApi } from '@/hooks/useNBAApi';

interface Leader {
  name: string;
  team: string;
  stat: number;
  stat_label: string;
}

export const Leaders: React.FC = () => {
  const { fetchLeaders, loading } = useNBAApi();
  const [category, setCategory] = useState<'scoring' | 'rebounds' | 'assists'>('scoring');
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const loadLeaders = async () => {
      const data = await fetchLeaders(category);
      setLeaders(data);
    };
    loadLeaders();
  }, [category]);

  const categories = [
    { id: 'scoring' as const, label: 'Pontos', emoji: '🏀' },
    { id: 'rebounds' as const, label: 'Rebotes', emoji: '🔄' },
    { id: 'assists' as const, label: 'Assistências', emoji: '🎯' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">👑</span>
        Líderes da Temporada
      </h2>

      {/* Tabs de categorias */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all whitespace-nowrap ${
              category === cat.id
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Lista de líderes */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400'
                  : index === 2
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400'
                  : 'bg-gray-50 border-gray-200 hover:border-pink-600'
              }`}
            >
              {/* Ranking */}
              <div className="flex items-center gap-4 flex-1">
                <div className={`text-2xl font-black w-10 text-center ${
                  index === 0 ? 'text-yellow-500' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-orange-500' :
                  'text-gray-500'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                </div>

                {/* Info do jogador */}
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{leader.name}</h3>
                  <p className="text-sm text-gray-600">{leader.team}</p>
                </div>
              </div>

              {/* Estatística */}
              <div className="text-right">
                <div className="text-3xl font-black text-pink-600">
                  {leader.stat}
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  {leader.stat_label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};