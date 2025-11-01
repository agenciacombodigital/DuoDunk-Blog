import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerComparisonProps {
  player1Id: string;
  onClose: () => void;
}

interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
}

interface PlayerData {
  id: string;
  name: string;
  position: string;
  team: {
    name: string;
    abbreviation: string;
    logo: string;
  };
  headshot: string;
  stats: PlayerStats;
}

interface ComparisonData {
  player1: PlayerData;
  player2: PlayerData;
  categories: Array<{
    name: string;
    label: string;
    player1Value: number;
    player2Value: number;
    winner: 1 | 2 | 'tie';
    higherIsBetter: boolean;
  }>;
}

const STAT_CATEGORIES = [
  { name: 'points', label: 'Pontos por Jogo', higherIsBetter: true },
  { name: 'rebounds', label: 'Rebotes por Jogo', higherIsBetter: true },
  { name: 'assists', label: 'Assistências por Jogo', higherIsBetter: true },
  { name: 'steals', label: 'Roubos por Jogo', higherIsBetter: true },
  { name: 'blocks', label: 'Tocos por Jogo', higherIsBetter: true },
  { name: 'turnovers', label: 'Turnovers por Jogo', higherIsBetter: false },
  { name: 'fieldGoalPct', label: 'FG%', higherIsBetter: true },
  { name: 'threePointPct', label: '3P%', higherIsBetter: true },
  { name: 'freeThrowPct', label: 'FT%', higherIsBetter: true },
];

// Estrutura de dados mockada para o perfil (já que a Edge Function só retorna stats)
const MOCK_PLAYER_PROFILE_BASE = (id: string, name: string, teamAbbr: string) => ({
  id: id,
  name: name,
  position: 'N/A',
  team: {
    name: teamAbbr,
    abbreviation: teamAbbr,
    logo: `https://cdn.nba.com/logos/nba/1610612737/global/L/logo.svg`, // Exemplo de logo
  },
  headshot: `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`,
  stats: {
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fieldGoalPct: 0,
    threePointPct: 0,
    freeThrowPct: 0,
  },
});

// Função para buscar dados de um jogador usando a nova Edge Function
const fetchPlayerData = async (playerId: string): Promise<PlayerData> => {
  // 1. Buscar estatísticas sazonais (usando a nova Edge Function)
  const currentSeason = 2025; 
  
  const { data: statsData, error: statsError } = await supabase.functions.invoke('player-stats', {
    body: { playerId, season: currentSeason }
  });

  if (statsError) {
    console.error('[COMPARISON] Erro ao buscar stats:', statsError);
    throw new Error('Erro ao buscar estatísticas do jogador.');
  }
  
  const stats = statsData?.stats;
  
  if (!stats) {
    // Se stats for null, lançamos um erro específico para ser capturado
    throw new Error('Estatísticas não encontradas para o jogador na temporada atual.');
  }

  // 2. Simular o perfil base (em um cenário real, buscaríamos isso de outra API)
  const profileBase = MOCK_PLAYER_PROFILE_BASE(playerId, stats.player_name || `Jogador ID ${playerId}`, 'NBA');

  // Mapeando a resposta para o formato PlayerData
  return {
    ...profileBase,
    stats: {
      points: stats.pts,
      rebounds: stats.reb,
      assists: stats.ast,
      steals: stats.stl,
      blocks: stats.blk,
      turnovers: stats.turnover,
      fieldGoalPct: stats.fg_pct,
      threePointPct: stats.fg3_pct,
      freeThrowPct: stats.ft_pct,
    },
  };
};

export default function PlayerComparison({ player1Id, onClose }: PlayerComparisonProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer2, setSelectedPlayer2] = useState('');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoadingPlayers(true);
      
      // Usando a Edge Function existente para a lista de jogadores
      const { data, error } = await supabase.functions.invoke('nba-players', {
        body: { search: '', teamId: null, position: null }
      });

      if (data?.success && data?.players) {
        const filteredPlayers = data.players.filter((p: any) => p.id !== player1Id);
        setPlayers(filteredPlayers);
      }
    } catch (err) {
      console.error('[COMPARISON] Erro ao carregar lista de jogadores:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedPlayer2) return;

    try {
      setLoading(true);
      toast.loading('Buscando dados para comparação...', { id: 'compare-toast' });

      // Para o Player 1, precisamos buscar os dados novamente, pois o componente Jogador.tsx não passa o perfil completo.
      const [p1Data, p2Data] = await Promise.all([
        fetchPlayerData(player1Id),
        fetchPlayerData(selectedPlayer2)
      ]);

      const categories = STAT_CATEGORIES.map(cat => {
        const p1Value = p1Data.stats[cat.name as keyof PlayerStats];
        const p2Value = p2Data.stats[cat.name as keyof PlayerStats];
        
        let winner: 1 | 2 | 'tie' = 'tie';
        if (p1Value !== p2Value) {
          if (cat.higherIsBetter) {
            winner = p1Value > p2Value ? 1 : 2;
          } else {
            winner = p1Value < p2Value ? 1 : 2;
          }
        }

        return {
          name: cat.name,
          label: cat.label,
          player1Value: p1Value,
          player2Value: p2Value,
          winner,
          higherIsBetter: cat.higherIsBetter,
        };
      });

      const comparisonResult: ComparisonData = {
        player1: p1Data,
        player2: p2Data,
        categories,
      };

      setComparison(comparisonResult);
      toast.success('Comparação concluída!', { id: 'compare-toast' });
    } catch (err: any) {
      console.error('[COMPARISON] Erro ao realizar comparação:', err);
      toast.error('Erro ao realizar comparação', { id: 'compare-toast', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBarWidth = (value1: number, value2: number, currentValue: number) => {
    const max = Math.max(value1, value2);
    if (max === 0) return 0;
    return (currentValue / max) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-3xl font-black">⚖️ Comparar Jogadores</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {!comparison ? (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Selecione um jogador para comparar:
              </h3>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {loadingPlayers ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredPlayers.slice(0, 30).map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer2(player.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedPlayer2 === player.id
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={player.headshot || 'https://via.placeholder.com/100'}
                          alt={player.name}
                          className="w-12 h-12 rounded-full object-cover bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{player.name}</p>
                          <p className="text-sm text-gray-600">{player.team.abbreviation}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={!selectedPlayer2 || loading}
                className="w-full mt-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Comparando...
                  </span>
                ) : (
                  'Comparar Jogadores'
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-8 mb-8">
                <div className="text-center">
                  <img
                    src={comparison.player1.headshot || 'https://via.placeholder.com/200'}
                    alt={comparison.player1.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-pink-500 shadow-lg"
                  />
                  <h3 className="text-2xl font-black text-gray-900">{comparison.player1.name}</h3>
                  <p className="text-gray-600 font-semibold">{comparison.player1.team.name}</p>
                  <p className="text-sm text-gray-500">{comparison.player1.position}</p>
                </div>

                <div className="flex items-center">
                  <span className="text-5xl font-black text-gray-300">VS</span>
                </div>

                <div className="text-center">
                  <img
                    src={comparison.player2.headshot || 'https://via.placeholder.com/200'}
                    alt={comparison.player2.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-purple-500 shadow-lg"
                  />
                  <h3 className="text-2xl font-black text-gray-900">{comparison.player2.name}</h3>
                  <p className="text-gray-600 font-semibold">{comparison.player2.team.name}</p>
                  <p className="text-sm text-gray-500">{comparison.player2.position}</p>
                </div>
              </div>

              <div className="space-y-6">
                {comparison.categories.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-gray-600">{category.label}</span>
                    </div>
                    
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                      <div className="text-right">
                        <span className={`text-2xl font-black ${
                          category.winner === 1 ? 'text-pink-600' : 'text-gray-400'
                        }`}>
                          {category.player1Value.toFixed(1)}
                        </span>
                      </div>

                      <div className="w-96">
                        <div className="flex gap-2">
                          <div className="flex-1 flex justify-end">
                            <div
                              className={`h-8 rounded-lg transition-all ${
                                category.winner === 1 ? 'bg-pink-500' : 'bg-gray-300'
                              }`}
                              style={{
                                width: `${getBarWidth(category.player1Value, category.player2Value, category.player1Value)}%`
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div
                              className={`h-8 rounded-lg transition-all ${
                                category.winner === 2 ? 'bg-purple-500' : 'bg-gray-300'
                              }`}
                              style={{
                                width: `${getBarWidth(category.player1Value, category.player2Value, category.player2Value)}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className={`text-2xl font-black ${
                          category.winner === 2 ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                          {category.player2Value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setComparison(null);
                  setSelectedPlayer2('');
                }}
                className="w-full mt-8 bg-gray-200 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-300 transition-all"
              >
                🔄 Nova Comparação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}