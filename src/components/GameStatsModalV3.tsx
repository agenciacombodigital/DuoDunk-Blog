import { useEffect, useState } from 'react';
import { X, Trophy, BarChart2, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerStats {
  id: number;
  nameI: string;
  jerseyNum: string;
  position: string;
  value?: number;
  stats?: any;
  oncourt?: boolean;
}

interface TeamStats {
  name: string;
  abbreviation: string;
  logo: string;
  score: string;
  record: string;
  performers: {
    points: PlayerStats[];
    rebounds: PlayerStats[];
    assists: PlayerStats[];
    steals: PlayerStats[];
    blocks: PlayerStats[];
  };
  allPlayers: PlayerStats[];
}

interface GameStats {
  status: string;
  gameState: string;
  gameClock: string;
  period: number;
  arena: string;
  city: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  gameTimeBrasilia: string;
  attendance: string;
}

interface GameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  homeTeam: any;
  awayTeam: any;
}

export default function GameStatsModalV3({ isOpen, onClose, gameId, homeTeam, awayTeam }: GameStatsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'boxscore'>('summary');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && gameId) {
      fetchStats();
    }
    return () => setStats(null);
  }, [isOpen, gameId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://brerfpcfkyptkzygyzxl.supabase.co/functions/v1/nba-game-stats-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameId,
          homeRecord: homeTeam.record,
          awayRecord: awayTeam.record
        })
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl h-[85vh] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header do Placar */}
        <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 pt-8 pb-6 px-4 sm:px-8 shrink-0 border-b border-white/5">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="flex items-center justify-between max-w-3xl mx-auto relative z-0">
            {/* Visitante */}
            <div className="flex flex-col items-center w-1/3">
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <div className="text-center mt-2">
                <h2 className="text-2xl md:text-4xl font-black text-white font-oswald tracking-wide">{awayTeam.triCode}</h2>
                <p className="text-zinc-500 text-xs md:text-sm font-medium">{stats?.awayTeam.record || awayTeam.record}</p>
              </div>
            </div>

            {/* Placar Central */}
            <div className="flex flex-col items-center justify-center w-1/3">
              {loading ? (
                 <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"/>
              ) : (
                <>
                  <div className="flex items-center gap-2 md:gap-6">
                    <span className="text-4xl md:text-7xl font-black text-white font-oswald tabular-nums tracking-tight">
                      {stats?.awayTeam.score || '0'}
                    </span>
                    <span className="text-zinc-700 text-2xl font-light hidden md:block">:</span>
                    <span className="text-4xl md:text-7xl font-black text-white font-oswald tabular-nums tracking-tight">
                      {stats?.homeTeam.score || '0'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col items-center gap-1">
                    {stats?.gameState === 'in' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-red-500/20 animate-pulse">
                        ● Ao Vivo
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs md:text-sm font-medium font-mono uppercase">
                       {stats?.status}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Casa */}
            <div className="flex flex-col items-center w-1/3">
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <div className="text-center mt-2">
                <h2 className="text-2xl md:text-4xl font-black text-white font-oswald tracking-wide">{homeTeam.triCode}</h2>
                <p className="text-zinc-500 text-xs md:text-sm font-medium">{stats?.homeTeam.record || homeTeam.record}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-center gap-2 p-2 bg-zinc-900/50 border-b border-white/5">
          {[
            { id: 'summary', label: 'Destaques', icon: Trophy },
            { id: 'boxscore', label: 'Box Score', icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-900/20" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Área de Conteúdo Scrollável */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Carregando estatísticas...</div>
          ) : stats ? (
            <div className="p-4 md:p-6 max-w-4xl mx-auto">
              
              {/* ABA DESTAQUES */}
              {activeTab === 'summary' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  {['points', 'rebounds', 'assists'].map((statKey) => {
                    const label = statKey === 'points' ? 'Pontuação' : statKey === 'rebounds' ? 'Rebotes' : 'Assistências';
                    const awayLeaders = stats.awayTeam.performers[statKey as keyof typeof stats.awayTeam.performers] || [];
                    const homeLeaders = stats.homeTeam.performers[statKey as keyof typeof stats.homeTeam.performers] || [];
                    const maxVal = Math.max(
                        awayLeaders[0]?.value || 0, 
                        homeLeaders[0]?.value || 0, 
                        1
                    );

                    return (
                      <div key={statKey} className="bg-zinc-900/40 rounded-xl border border-white/5 overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 flex items-center justify-center border-b border-white/5">
                          <h3 className="text-zinc-400 font-oswald text-sm tracking-widest uppercase">{label}</h3>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-white/5">
                          {/* Visitante */}
                          <div className="p-3 space-y-3">
                             {awayLeaders.slice(0, 5).map((player, i) => (
                               <PlayerRow key={player.id} player={player} rank={i+1} maxVal={maxVal} />
                             ))}
                             {awayLeaders.length === 0 && <p className="text-zinc-600 text-xs text-center py-2">-</p>}
                          </div>
                          {/* Casa */}
                          <div className="p-3 space-y-3">
                             {homeLeaders.slice(0, 5).map((player, i) => (
                               <PlayerRow key={player.id} player={player} rank={i+1} maxVal={maxVal} alignRight />
                             ))}
                             {homeLeaders.length === 0 && <p className="text-zinc-600 text-xs text-center py-2">-</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Info Extra */}
                  <div className="grid grid-cols-3 gap-2 text-center py-4 opacity-60">
                     <div className="bg-zinc-900 p-2 rounded text-xs text-zinc-400">
                        <MapPin size={12} className="mx-auto mb-1"/> {stats.city}
                     </div>
                     <div className="bg-zinc-900 p-2 rounded text-xs text-zinc-400">
                        <Users size={12} className="mx-auto mb-1"/> {stats.attendance || '-'}
                     </div>
                     <div className="bg-zinc-900 p-2 rounded text-xs text-zinc-400">
                        <Clock size={12} className="mx-auto mb-1"/> {stats.gameTimeBrasilia}
                     </div>
                  </div>
                </div>
              )}

              {/* ABA BOX SCORE */}
              {activeTab === 'boxscore' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <BoxScoreTable team={stats.awayTeam} />
                  <BoxScoreTable team={stats.homeTeam} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-20">Dados indisponíveis.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const PlayerRow = ({ player, rank, maxVal, alignRight }: { player: PlayerStats, rank: number, maxVal: number, alignRight?: boolean }) => (
  <div className={cn("flex items-center gap-3 group", alignRight ? "flex-row-reverse text-right" : "flex-row")}>
    <img 
      src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`} 
      onError={(e) => (e.currentTarget.src = 'https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png')}
      alt=""
      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 object-cover border border-white/10"
    />
    <div className="flex-1 min-w-0">
      <div className={cn("flex items-end gap-2", alignRight && "flex-row-reverse")}>
         <span className="text-sm font-bold text-zinc-200 leading-none truncate">{player.nameI}</span>
         <span className="text-xs font-black text-pink-500 font-oswald leading-none text-lg">{player.value}</span>
      </div>
      <div className={cn("h-1 mt-1 bg-zinc-800 rounded-full overflow-hidden flex", alignRight && "justify-end")}>
         <div 
           className="h-full bg-zinc-500 rounded-full"
           style={{ width: `${((player.value || 0) / maxVal) * 100}%` }}
         />
      </div>
    </div>
  </div>
);

const BoxScoreTable = ({ team }: { team: TeamStats }) => (
  <div className="bg-zinc-900/30 rounded-xl border border-white/5 overflow-hidden">
    <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
      <img src={team.logo} className="w-5 h-5" alt="" />
      <h3 className="font-bold text-zinc-300 text-sm tracking-wide uppercase">{team.name}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-zinc-950 text-zinc-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Jogador</th>
            <th className="px-1 py-2 text-center font-mono">MIN</th>
            <th className="px-1 py-2 text-center text-white font-bold">PTS</th>
            <th className="px-1 py-2 text-center">REB</th>
            <th className="px-1 py-2 text-center">AST</th>
            <th className="px-1 py-2 text-center hidden sm:table-cell">STL</th>
            <th className="px-1 py-2 text-center hidden sm:table-cell">BLK</th>
            <th className="px-1 py-2 text-center hidden sm:table-cell">FG</th>
            <th className="px-1 py-2 text-center hidden sm:table-cell">3P</th>
            <th className="px-1 py-2 text-center">+/-</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {team.allPlayers.map((p) => (
            <tr key={p.id} className="hover:bg-white/5 transition-colors">
              <td className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                 <span className="inline-block w-4 text-zinc-600 text-[10px] mr-1">{p.jerseyNum}</span>
                 {p.nameI}
              </td>
              <td className="px-1 py-2 text-center text-zinc-500 font-mono">{p.stats?.minutes}</td>
              <td className="px-1 py-2 text-center text-white font-bold bg-white/5">{p.stats?.points}</td>
              <td className="px-1 py-2 text-center text-zinc-400">{p.stats?.rebounds}</td>
              <td className="px-1 py-2 text-center text-zinc-400">{p.stats?.assists}</td>
              <td className="px-1 py-2 text-center text-zinc-500 hidden sm:table-cell">{p.stats?.steals}</td>
              <td className="px-1 py-2 text-center text-zinc-500 hidden sm:table-cell">{p.stats?.blocks}</td>
              <td className="px-1 py-2 text-center text-zinc-500 hidden sm:table-cell">{p.stats?.fgm}/{p.stats?.fga}</td>
              <td className="px-1 py-2 text-center text-zinc-500 hidden sm:table-cell">{p.stats?.fg3m}/{p.stats?.fg3a}</td>
              <td className={cn("px-1 py-2 text-center font-medium", (p.stats?.plusMinus || 0) > 0 ? "text-green-500" : "text-red-500")}>
                {p.stats?.plusMinus > 0 ? '+' : ''}{p.stats?.plusMinus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);