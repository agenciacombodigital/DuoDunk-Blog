import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Loader2 } from 'lucide-react';
import { NBA_TEAMS } from '@/lib/nbaTeams';

interface Player {
  id: string;
  name: string;
  position: string;
  jersey: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
  headshot: string;
}

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

export default function Jogadores() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, selectedTeam, selectedPosition, players]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('nba-players', {
        body: {
          search: '',
          teamId: null,
          position: null
        }
      });

      if (error) {
        console.error('[JOGADORES] Erro:', error);
        return;
      }

      if (data?.success && data?.players) {
        setPlayers(data.players);
        setFilteredPlayers(data.players);
      }
    } catch (err) {
      console.error('[JOGADORES] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...players];

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchLower)
      );
    }

    if (selectedTeam !== '') {
      filtered = filtered.filter(player =>
        player.team.id === selectedTeam
      );
    }

    if (selectedPosition !== '') {
      filtered = filtered.filter(player =>
        player.position === selectedPosition
      );
    }

    setFilteredPlayers(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">
            🏀 Jogadores da NBA
          </h1>
          <p className="text-xl text-gray-600">
            Explore perfis, estatísticas e compare seus jogadores favoritos
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="">Todos os Times</option>
                {NBA_TEAMS.sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="">Todas as Posições</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {loading ? (
              <span>Carregando jogadores...</span>
            ) : (
              <span>
                <strong className="text-pink-600 font-bold">{filteredPlayers.length}</strong> jogador(es) encontrado(s)
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-pink-600 mb-4" />
            <p className="text-gray-600 font-medium text-lg">Carregando jogadores...</p>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <Link
                key={player.id}
                to={`/jogadores/${player.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 hover:border-pink-500 hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {player.headshot ? (
                    <img
                      src={player.headshot}
                      alt={player.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Photo';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl font-bold">
                      ?
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white font-black text-2xl px-4 py-2 rounded-xl">
                    #{player.jersey}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-pink-600 transition-colors line-clamp-1">
                    {player.name}
                  </h3>

                  <p className="text-sm text-gray-600 font-semibold mb-3">
                    {player.position}
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    {player.team.logo && (
                      <img
                        src={player.team.logo}
                        alt={player.team.name}
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">
                        {player.team.name}
                      </p>
                      <p className="text-sm text-gray-900 font-bold">
                        {player.team.abbreviation}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-300 text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum jogador encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou buscar por outro nome
            </p>
          </div>
        )}
      </div>
    </div>
  );
}