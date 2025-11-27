import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  Trophy, 
  BarChart2, 
  Clock, 
  MapPin, 
  Users, 
  Activity,
  UsersRound,
  ChevronDown,
  ChevronUp,
  Calendar,
  Dribbble,
  Maximize,
  Handshake,
} from 'lucide-react';
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
  teamStats?: any; // Estatísticas gerais do time
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
  quarterScores?: {
    home: { period: number; score: string }[];
    away: { period: number; score: string }[];
  };
}

interface GameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  homeTeam: any;
  awayTeam: any;
}

// Helper para obter a URL da foto do jogador
const getPlayerHeadshot = (personId: string) => {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${personId}.png`;
};

// Helper para formatar o tempo de jogo
const formatGameClock = (clock: string): string => {
  if (!clock || clock === '') return '';
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (match) {
    const minutes = match[1].padStart(2, '0');
    const seconds = Math.floor(parseFloat(match[2])).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  return clock;
};

// Helper para determinar o status de exibição
const getGameStatusDisplay = (game: any, stats: any): string => {
  if (stats.gameState === 'post') return 'FINAL';
  if (stats.gameState === 'pre') return stats.gameTimeBrasilia;
  
  if (stats.gameState === 'in') {
    const clock = formatGameClock(stats.gameClock);
    if (clock === '00:00' && stats.period === 2) return 'INTERVALO';
    if (clock === '00:00' && (stats.period === 1 || stats.period === 3)) return `FIM DO ${stats.period}º Q`;
    return `${stats.period}º Q • ${clock}`;
  }
  return game.gameStatusText;
};

// Componente Card de Destaque (para a aba Resumo)
const PerformerCard = ({ performer, statName, Icon, color }: { performer: any, statName: string, Icon: any, color: string }) => {
  const headshotUrl = getPlayerHeadshot(performer.id);
  
  return (
    <div className={`relative p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl transition-all hover:scale-[1.02] overflow-hidden`}>
      <div className={`absolute inset-0 opacity-10 ${color === 'pink' ? 'bg-pink-500' : color === 'cyan' ? 'bg-cyan-500' : 'bg-green-500'}`}></div>
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
            <img 
              src={headshotUrl} 
              alt={performer.nameI} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<${Icon.name} class="w-6 h-6 text-white/70" />`;
              }}
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{statName}</p>
            <h4 className="text-lg font-bold text-white">{performer.nameI}</h4>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black font-oswald ${color === 'pink' ? 'text-pink-400' : color === 'cyan' ? 'text-cyan-400' : 'text-green-400'}`}>{performer.value}</p>
          <p className="text-xs text-gray-500">#{performer.jerseyNum} | {performer.position}</p>
        </div>
      </div>
    </div>
  );
};

// Componente Barra de Comparação de Estatísticas
const StatBar = ({ label, val1, val2, isPercent, inverse }: { label: string, val1: number, val2: number, isPercent?: boolean, inverse?: boolean }) => {
    const total = Number(val1) + Number(val2) || 1;
    const pct1 = (Number(val1) / total) * 100;
    const pct2 = (Number(val2) / total) * 100;
    const isV1Higher = inverse ? val1 < val2 : val1 > val2;
    const isV2Higher = inverse ? val2 < val1 : val2 > val1;

    return (
        <div className="group">
            <div className="flex justify-between text-xs mb-1 font-medium">
                <span className={cn(isV1Higher ? "text-white" : "text-zinc-500")}>{val1}{isPercent && '%'}</span>
                <span className="text-zinc-400 font-oswald tracking-widest text-[10px] uppercase">{label}</span>
                <span className={cn(isV2Higher ? "text-white" : "text-zinc-500")}>{val2}{isPercent && '%'}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                <div className={cn("h-full transition-all duration-500", isV1Higher ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${pct1}%` }} />
                <div className="w-0.5 bg-black/50" />
                <div className={cn("h-full transition-all duration-500", isV2Higher ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${pct2}%` }} />
            </div>
        </div>
    )
}

// Componente Tabela de Box Score (para a aba Box Score)
const BoxScoreTable = ({ team }: { team: TeamStats }) => {
  const [showAll, setShowAll] = useState(false);
  const visiblePlayers = team.allPlayers?.slice(0, showAll ? undefined : 8) || [];
  const totalPlayers = team.allPlayers?.length || 0;

  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={team.logo} alt={team.name} className="w-8 h-8" />
          <h4 className="text-xl font-black text-white font-oswald">{team.abbreviation}</h4>
        </div>
        {totalPlayers > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold transition-colors"
          >
            {showAll ? 'Mostrar Menos' : `Ver Todos (${totalPlayers})`}
            {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-xs sm:text-sm">
          <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm">
            <tr className="border-b border-gray-700 text-gray-400 uppercase font-bold">
              <th className="text-left py-3 px-2 w-1/4">JOGADOR</th>
              <th className="text-center py-3 px-1">MIN</th>
              <th className="text-center py-3 px-1 text-pink-400">PTS</th>
              <th className="text-center py-3 px-1">REB</th>
              <th className="text-center py-3 px-1">AST</th>
              <th className="text-center py-3 px-1 hidden sm:table-cell">FG</th>
              <th className="px-1 py-2 text-center hidden sm:table-cell">3P</th>
              <th className="text-center py-3 px-1">+/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visiblePlayers.map((player: any, i: number) => (
              <tr 
                key={`player-${team.abbreviation}-${i}`}
                className={`transition-colors ${player.starter ? 'bg-white/5' : 'hover:bg-white/10'}`}
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 hidden sm:inline">#{player.jerseyNum}</span>
                    <div>
                      <span className="font-bold text-white text-sm block">{player.nameI}</span>
                      <span className="text-xs text-gray-500">{player.position}</span>
                    </div>
                  </div>
                </td>
                <td className="text-center py-2 px-1 text-gray-300 font-mono text-xs">
                  {player.stats.minutes}
                </td>
                <td className="text-center py-2 px-1 text-pink-400 font-bold">
                  {player.stats.points}
                </td>
                <td className="text-center py-2 px-1 text-gray-300">
                  {player.stats.rebounds}
                </td>
                <td className="text-center py-2 px-1 text-gray-300">
                  {player.stats.assists}
                </td>
                <td className="text-center py-2 px-1 text-gray-300 font-mono text-xs hidden sm:table-cell">
                  {player.stats.fgm}/{player.stats.fga}
                </td>
                <td className="px-1 py-2 text-center text-gray-300 font-mono text-xs hidden sm:table-cell">
                  {player.stats.fg3m}/{player.stats.fg3a}
                </td>
                <td className={`text-center py-2 px-1 font-bold ${
                  parseInt(player.stats.plusMinus) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {parseInt(player.stats.plusMinus) >= 0 ? '+' : ''}{player.stats.plusMinus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default function GameStatsModalV3({ isOpen, onClose, gameId, homeTeam, awayTeam }: GameStatsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'team_stats' | 'boxscore'>('summary');
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

  // Lógica para jogos agendados
  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-white text-lg font-bold">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.isScheduled) {
    return (
      <div
        className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-gray-900 rounded-3xl p-8 max-w-md text-center relative border border-gray-700/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
          <Calendar className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2 font-oswald uppercase">
            Jogo Agendado
          </h2>
          <p className="text-gray-400 mb-6">
            As estatísticas estarão disponíveis assim que o jogo começar.
          </p>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Horário de Início (BR)</p>
            <p className="text-lg font-bold text-white font-oswald">
              {homeTeam.gameTimeBrasilia || 'N/D'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const gameStatusDisplay = getGameStatusDisplay(homeTeam, stats);
  const isLive = stats.gameState === 'in';

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
                    <span className="text-5xl sm:text-7xl font-black text-white font-oswald tabular-nums tracking-tight">
                      {stats?.awayTeam.score || '0'}
                    </span>
                    <span className="text-zinc-700 text-2xl font-light hidden md:block">:</span>
                    <span className="text-5xl sm:text-7xl font-black text-white font-oswald tabular-nums tracking-tight">
                      {stats?.homeTeam.score || '0'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col items-center gap-1">
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] md:text-xs font-bold uppercase tracking-wider border border-red-500/20 animate-pulse">
                        ● Ao Vivo
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs md:text-sm font-medium font-mono uppercase">
                       {gameStatusDisplay}
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
        <div className="flex items-center justify-center gap-2 p-2 bg-zinc-900/50 border-b border-white/5 overflow-x-auto">
          {[
            { id: 'summary', label: 'Destaques', icon: Trophy },
            { id: 'team_stats', label: 'Stats do Time', icon: Activity }, // Nova Aba
            { id: 'boxscore', label: 'Box Score', icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap",
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
          {stats ? (
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
                          <div className="p-3 space-y-3">
                             {awayLeaders.slice(0, 5).map((player, i) => (
                               <PlayerRow key={player.id} player={player} rank={i+1} maxVal={maxVal} />
                             ))}
                             {awayLeaders.length === 0 && <p className="text-zinc-600 text-xs text-center py-2">-</p>}
                          </div>
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

              {/* ABA TEAM STATS (NOVA) */}
              {activeTab === 'team_stats' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-zinc-900/30 rounded-xl border border-white/5 p-6">
                      <div className="flex justify-between text-zinc-500 text-xs font-bold uppercase mb-6 tracking-wider">
                         <span>{awayTeam.triCode}</span>
                         <span>Comparativo</span>
                         <span>{homeTeam.triCode}</span>
                      </div>
                      
                      <div className="space-y-6">
                        <StatBar label="Aproveitamento de Arremesso (FG%)" 
                                 val1={parseFloat(stats.awayTeam.teamStats?.fieldGoalPct || 0)} 
                                 val2={parseFloat(stats.homeTeam.teamStats?.fieldGoalPct || 0)} 
                                 isPercent />
                        <StatBar label="Bolas de 3 (3P%)" 
                                 val1={parseFloat(stats.awayTeam.teamStats?.threePointerPct || 0)} 
                                 val2={parseFloat(stats.homeTeam.teamStats?.threePointerPct || 0)} 
                                 isPercent />
                        <StatBar label="Lances Livres (FT%)" 
                                 val1={parseFloat(stats.awayTeam.teamStats?.freeThrowPct || 0)} 
                                 val2={parseFloat(stats.homeTeam.teamStats?.freeThrowPct || 0)} 
                                 isPercent />
                        <div className="border-t border-white/5 my-4"></div>
                        <StatBar label="Rebotes Totais" 
                                 val1={parseInt(stats.awayTeam.teamStats?.rebounds || 0)} 
                                 val2={parseInt(stats.homeTeam.teamStats?.rebounds || 0)} />
                        <StatBar label="Assistências" 
                                 val1={parseInt(stats.awayTeam.teamStats?.assists || 0)} 
                                 val2={parseInt(stats.homeTeam.teamStats?.assists || 0)} />
                        <StatBar label="Roubos de Bola" 
                                 val1={parseInt(stats.awayTeam.teamStats?.steals || 0)} 
                                 val2={parseInt(stats.homeTeam.teamStats?.steals || 0)} />
                        <StatBar label="Tocos" 
                                 val1={parseInt(stats.awayTeam.teamStats?.blocks || 0)} 
                                 val2={parseInt(stats.homeTeam.teamStats?.blocks || 0)} />
                        <StatBar label="Turnovers" 
                                 val1={parseInt(stats.awayTeam.teamStats?.turnovers || 0)} 
                                 val2={parseInt(stats.homeTeam.teamStats?.turnovers || 0)} 
                                 inverse /> 
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-950/90 backdrop-blur-lg border-t border-white/10 p-4 text-center">
          <p className="text-gray-400 text-xs">
            🏀 Dados em tempo real da NBA • Atualizado a cada 5 segundos durante jogos ao vivo
          </p>
        </div>
      </div>
    </div>
  );
}

// Componentes Auxiliares
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

const StatBar = ({ label, val1, val2, isPercent, inverse }: { label: string, val1: number, val2: number, isPercent?: boolean, inverse?: boolean }) => {
    const total = Number(val1) + Number(val2) || 1;
    const pct1 = (Number(val1) / total) * 100;
    const pct2 = (Number(val2) / total) * 100;
    const isV1Higher = inverse ? val1 < val2 : val1 > val2;
    const isV2Higher = inverse ? val2 < val1 : val2 > val1;

    return (
        <div className="group">
            <div className="flex justify-between text-xs mb-1 font-medium">
                <span className={cn(isV1Higher ? "text-white" : "text-zinc-500")}>{val1}{isPercent && '%'}</span>
                <span className="text-zinc-400 font-oswald tracking-widest text-[10px] uppercase">{label}</span>
                <span className={cn(isV2Higher ? "text-white" : "text-zinc-500")}>{val2}{isPercent && '%'}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                <div className={cn("h-full transition-all duration-500", isV1Higher ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${pct1}%` }} />
                <div className="w-0.5 bg-black/50" />
                <div className={cn("h-full transition-all duration-500", isV2Higher ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${pct2}%` }} />
            </div>
        </div>
    )
}

const BoxScoreTable = ({ team }: { team: TeamStats }) => {
  const [showAll, setShowAll] = useState(false);
  const visiblePlayers = team.allPlayers?.slice(0, showAll ? undefined : 8) || [];
  const totalPlayers = team.allPlayers?.length || 0;

  return (
    <div className="bg-zinc-900/30 rounded-xl border border-white/5 overflow-hidden">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-3">
        <img src={team.logo} alt={team.name} className="w-5 h-5" />
        <h3 className="font-bold text-zinc-300 text-sm tracking-wide uppercase">{team.name}</h3>
        {totalPlayers > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="ml-auto flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold transition-colors"
          >
            {showAll ? 'Mostrar Menos' : `Ver Todos (${totalPlayers})`}
            {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm">
            <tr className="border-b border-gray-700 text-gray-400 uppercase font-bold">
              <th className="px-3 py-2 text-left font-medium">JOGADOR</th>
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
            {visiblePlayers.map((p) => (
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
};