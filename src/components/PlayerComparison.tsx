import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Search } from 'lucide-react';

// Simplified Player types for this component
interface Player {
  id: string;
  name: string;
}

interface PlayerProfile {
  id: string;
  name: string;
  team: { name: string; logo: string; };
  headshotLarge: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fieldGoalPct: number;
    threePointPct: number;
  };
}

interface Props {
  player1Id: string;
  onClose: () => void;
}

export default function PlayerComparison({ player1Id, onClose }: Props) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<PlayerProfile | null>(null);
  const [player2, setPlayer2] = useState<PlayerProfile | null>(null);
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllPlayers();
    loadPlayerProfile(player1Id, setPlayer1, setLoading1);
  }, [player1Id]);

  const loadAllPlayers = async () => {
    const { data } = await supabase.functions.invoke('nba-players');
    if (data?.success) {
      setAllPlayers(data.players);
    }
  };

  const loadPlayerProfile = async (id: string, setter: (p: PlayerProfile | null) => void, loader: (l: boolean) => void) => {
    loader(true);
    const { data } = await supabase.functions.invoke('nba-player-profile', { body: { playerId: id } });
    if (data?.success) {
      setter(data.player);
    }
    loader(false);
  };

  const handlePlayerSelect = (player: Player) => {
    loadPlayerProfile(player.id, setPlayer2, setLoading2);
    setSearch('');
  };

  const filteredPlayers = search
    ? allPlayers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) && p.id !== player1Id)
    : [];

  const StatRow = ({ label, value1, value2 }: { label: string, value1: number, value2: number }) => {
    const isP1Winner = value1 > value2;
    const isP2Winner = value2 > value1;
    const formatValue = (val: number) => val % 1 !== 0 ? val.toFixed(1) : val;

    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-800">
        <span className={`font-bold text-lg ${isP1Winner ? 'text-green-400' : 'text-white'}`}>{formatValue(value1)}</span>
        <span className="text-sm text-gray-400 font-semibold">{label}</span>
        <span className={`font-bold text-lg ${isP2Winner ? 'text-green-400' : 'text-white'}`}>{formatValue(value2)}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Comparar Jogadores</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6">
          {/* Player 1 */}
          <div className="text-center">
            {loading1 ? <Loader2 className="w-12 h-12 animate-spin mx-auto" /> : player1 && (
              <>
                <img src={player1.headshotLarge} alt={player1.name} className="w-32 h-32 rounded-full mx-auto border-4 border-pink-500" />
                <h3 className="text-2xl font-bold mt-4">{player1.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <img src={player1.team.logo} alt={player1.team.name} className="w-6 h-6" />
                  <p className="text-gray-400">{player1.team.name}</p>
                </div>
              </>
            )}
          </div>

          {/* Player 2 */}
          <div className="text-center">
            {loading2 ? <Loader2 className="w-12 h-12 animate-spin mx-auto" /> : player2 ? (
              <>
                <img src={player2.headshotLarge} alt={player2.name} className="w-32 h-32 rounded-full mx-auto border-4 border-cyan-500" />
                <h3 className="text-2xl font-bold mt-4">{player2.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <img src={player2.team.logo} alt={player2.team.name} className="w-6 h-6" />
                  <p className="text-gray-400">{player2.team.name}</p>
                </div>
              </>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar jogador..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-10 py-3"
                  />
                </div>
                {search && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                    {filteredPlayers.slice(0, 10).map(p => (
                      <button key={p.id} onClick={() => handlePlayerSelect(p)} className="w-full text-left px-4 py-2 hover:bg-gray-700">
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {player1 && player2 && (
            <div className="p-6 space-y-3">
              <StatRow label="Pontos" value1={player1.stats.points} value2={player2.stats.points} />
              <StatRow label="Rebotes" value1={player1.stats.rebounds} value2={player2.stats.rebounds} />
              <StatRow label="Assistências" value1={player1.stats.assists} value2={player2.stats.assists} />
              <StatRow label="Roubos" value1={player1.stats.steals} value2={player2.stats.steals} />
              <StatRow label="Tocos" value1={player1.stats.blocks} value2={player2.stats.blocks} />
              <StatRow label="FG%" value1={player1.stats.fieldGoalPct} value2={player2.stats.fieldGoalPct} />
              <StatRow label="3P%" value1={player1.stats.threePointPct} value2={player2.stats.threePointPct} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}