import React, { useState } from 'react';
import { useNBAApi } from '@/hooks/useNBAApi';

interface Player {
  name: string;
  identifier: string;
  league: string;
  position: string;
}

export const PlayerSearch: React.FC = () => {
  const { searchPlayers, loading, error } = useNBAApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 2) return;
    
    setHasSearched(true);
    const data = await searchPlayers(searchTerm);
    setResults(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <span className="text-3xl">🔍</span>
        Buscar Jogador
      </h2>

      {/* Formulário de busca */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome do jogador..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 transition-colors"
            minLength={2}
          />
          <button
            type="submit"
            disabled={loading || searchTerm.length < 2}
            className="px-8 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Digite pelo menos 2 caracteres para buscar
        </p>
      </form>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 mb-4">
          ❌ {error}
        </div>
      )}

      {/* Resultados */}
      {hasSearched && !loading && (
        <div>
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🤷</p>
              <p className="text-gray-600 font-semibold">
                Nenhum jogador encontrado para "{searchTerm}"
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Tente buscar por outro nome
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {results.length} jogador(es) encontrado(s)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((player, index) => (
                  <div
                    key={index}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {player.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Posição: <span className="font-semibold">{player.position}</span>
                        </p>
                      </div>
                      <span className="bg-pink-100 text-pink-600 text-xs font-bold px-3 py-1 rounded-full">
                        NBA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      )}
    </div>
  );
};