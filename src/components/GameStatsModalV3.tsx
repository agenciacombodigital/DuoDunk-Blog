import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  Trophy, 
  Users, 
  Zap,
  Target,
  Clock,
  MapPin,
  UsersRound,
  ChevronDown,
  ChevronUp,
  Calendar,
  User, // Para fallback de foto
  Dribbble, // Para pontos
  Maximize, // Para rebotes
  Handshake, // Para assistências
} from 'lucide-react';

// Interface baseada na Edge Function nba-game-stats-v3
interface Game {
  gameId: string;
  gameStatus: number;
  gameTimeBrasilia: string;
  gameStatusText: string;
  homeTeam: { teamTricode: string; wins: number; losses: number };
  awayTeam: { teamTricode: string; wins: number; losses: number };
}

interface Props {
  game: Game;
  onClose: () => void;
}

// Helper para obter a URL da foto do jogador
const getPlayerHeadshot = (personId: string) => {
  // URL da API oficial da NBA para headshots
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
const getGameStatusDisplay = (game: Game, stats: any): string => {
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

// Componente Tabela de Box Score (para a aba Box Score)
const BoxScoreTable = ({ team, showAll, setShowAll }: { team: any, showAll: boolean, setShowAll: (show: boolean) => void }) => {
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
              <th className="text-center py-3 px-1 hidden sm:table-cell">3P</th>
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
                <td className="text-center py-2 px-1 text-gray-300 font-mono text-xs hidden sm:table-cell">
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


export default function GameStatsModalV3({ game, onClose }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumo' | 'team' | 'boxscore'>('resumo');
  const [showAllHome, setShowAllHome] = useState(false);
  const [showAllAway, setShowAllAway] = useState(false);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-game-stats-v3', {
        body: {
          gameId: game.gameId,
          gameStatus: game.gameStatus,
          homeRecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
          awayRecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`,
        }
      });

      if (error) throw error;
      
      if (data?.isScheduled) {
        setStats({ isScheduled: true });
        return;
      }
      
      if (data?.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('[MODAL V3] Erro ao carregar stats:', err);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadStats();
      setLoading(false);
    };

    initialLoad();

    if (game.gameStatus === 2) {
      const interval = setInterval(loadStats, 5000);
      return () => clearInterval(interval);
    }
  }, [game.gameId, game.gameStatus]);

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
              {game.gameTimeBrasilia || game.gameStatusText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const gameStatusDisplay = getGameStatusDisplay(game, stats);
  const isLive = stats.gameState === 'in';

  return (
    <div
      className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl border border-white/10 shadow-2xl scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right p-2 hover:bg-white/10 rounded-full transition-colors z-20 backdrop-blur-sm bg-black/50"
        >
          <X className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>

        {/* Header com Placar */}
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-lg p-4 sm:p-8 z-10 border-b border-white/10">
          {/* Info do Jogo */}
          <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs text-gray-400 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{stats.arena}</span>
            </div>
            {stats.attendance !== 'N/D' && (
              <div className="flex items-center gap-1">
                <UsersRound className="w-3 h-3" />
                <span>{stats.attendance} pessoas</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1">
              <img 
                src={stats.awayTeam.logo} 
                alt={stats.awayTeam.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 drop-shadow-lg"
              />
              <div className="text-left">
                <h2 className="text-3xl sm:text-5xl font-black font-oswald text-white">{stats.awayTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400 hidden sm:block">{stats.awayTeam.name}</p>
                <p className="text-xs text-gray-500">{stats.awayTeam.record}</p>
              </div>
            </div>

            {/* Score & Status */}
            <div className="text-center px-1 sm:px-8 flex flex-col items-center">
              <div className="flex items-center gap-2 sm:gap-6">
                <span className="text-5xl sm:text-7xl font-black font-oswald text-white tabular-nums">{stats.awayTeam.score}</span>
                <span className="text-2xl sm:text-4xl font-bold text-pink-600 font-oswald">VS</span>
                <span className="text-5xl sm:text-7xl font-black font-oswald text-white tabular-nums">{stats.homeTeam.score}</span>
              </div>
              <div className="mt-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  isLive ? 'bg-red-600 text-white animate-pulse' : 
                  stats.gameState === 'post' ? 'bg-green-600 text-white' : 
                  'bg-cyan-600 text-white'
                }`}>
                  {gameStatusDisplay}
                </span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1 flex-row-reverse">
              <img 
                src={stats.homeTeam.logo} 
                alt={stats.homeTeam.name} 
                className="w-16 h-16 sm:w-24 sm:h-24 drop-shadow-lg"
              />
              <div className="text-right">
                <h2 className="text-3xl sm:text-5xl font-black font-oswald text-white">{stats.homeTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400 hidden sm:block">{stats.homeTeam.name}</p>
                <p className="text-xs text-gray-500">{stats.homeTeam.record}</p>
              </div>
            </div>
          </div>

          {/* Quarter Scores */}
          {stats.quarterScores && stats.quarterScores.away.length > 0 && (
            <div className="mt-6 bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
              <div className="grid grid-cols-6 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-mono">
                <div className="font-bold text-gray-400">TIME</div>
                <div className="font-bold text-gray-400">1Q</div>
                <div className="font-bold text-gray-400">2Q</div>
                <div className="font-bold text-gray-400">3Q</div>
                <div className="font-bold text-gray-400">4Q</div>
                <div className="font-black text-white">TOTAL</div>

                <div className="font-bold text-white">{stats.awayTeam.abbreviation}</div>
                {stats.quarterScores.away.slice(0, 4).map((q: any, i: number) => (
                  <div key={`away-q-${i}`} className="text-gray-300">{q.score}</div>
                ))}
                <div className="font-black text-pink-400 text-base">{stats.awayTeam.score}</div>

                <div className="font-bold text-white">{stats.homeTeam.abbreviation}</div>
                {stats.quarterScores.home.slice(0, 4).map((q: any, i: number) => (
                  <div key={`home-q-${i}`} className="text-gray-300">{q.score}</div>
                ))}
                <div className="font-black text-pink-400 text-base">{stats.homeTeam.score}</div>
              </div>
            </div>
          )}

          {/* Tabs (Pílulas) */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab('resumo')}
              className={`px-4 py-2 rounded-full font-bold transition-all text-xs sm:text-sm ${
                activeTab === 'resumo'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-1" />
              Resumo
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-full font-bold transition-all text-xs sm:text-sm ${
                activeTab === 'team'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Target className="w-4 h-4 inline mr-1" />
              Estatísticas do Time
            </button>
            <button
              onClick={() => setActiveTab('boxscore')}
              className={`px-4 py-2 rounded-full font-bold transition-all text-xs sm:text-sm ${
                activeTab === 'boxscore'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Box Score
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8">
          {/* TAB: RESUMO (DESTAQUES) */}
          {activeTab === 'resumo' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-white mb-6 font-oswald uppercase">
                Top Performers
              </h3>

              {/* Destaques Principais (Pontos) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.homeTeam.performers?.points?.[0] && (
                  <PerformerCard 
                    performer={stats.homeTeam.performers.points[0]} 
                    statName={`Cestinha (${stats.homeTeam.abbreviation})`} 
                    Icon={Dribbble} 
                    color="pink"
                  />
                )}
                {stats.awayTeam.performers?.points?.[0] && (
                  <PerformerCard 
                    performer={stats.awayTeam.performers.points[0]} 
                    statName={`Cestinha (${stats.awayTeam.abbreviation})`} 
                    Icon={Dribbble} 
                    color="pink"
                  />
                )}
              </div>
              
              {/* Destaques Secundários (Rebotes, Assistências) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rebotes */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <Maximize className="w-5 h-5 text-cyan-400" />
                    Rebotes
                  </h4>
                  {[...stats.homeTeam.performers?.rebounds?.slice(0, 2) || [], ...stats.awayTeam.performers?.rebounds?.slice(0, 2) || []]
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 2)
                    .map((p: any, i: number) => (
                      <PerformerCard 
                        key={`reb-${i}`}
                        performer={p} 
                        statName="Reboteiro" 
                        Icon={Maximize} 
                        color="cyan"
                      />
                    ))}
                </div>

                {/* Assistências */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-lg flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-green-400" />
                    Assistências
                  </h4>
                  {[...stats.homeTeam.performers?.assists?.slice(0, 2) || [], ...stats.awayTeam.performers?.assists?.slice(0, 2) || []]
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 2)
                    .map((p: any, i: number) => (
                      <PerformerCard 
                        key={`ast-${i}`}
                        performer={p} 
                        statName="Assistente" 
                        Icon={Handshake} 
                        color="green"
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ESTATÍSTICAS DO TIME */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white mb-6 font-oswald uppercase">
                Estatísticas Comparativas
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Stats */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={stats.homeTeam.logo} alt={stats.homeTeam.name} className="w-12 h-12" />
                    <div>
                      <h4 className="text-xl font-black text-white font-oswald">{stats.homeTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.homeTeam.name}</p>
                    </div>
                  </div>

                  {stats.homeTeam.teamStats && (
                    <div className="space-y-3">
                      {Object.entries(stats.homeTeam.teamStats).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white font-bold font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Away Team Stats */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={stats.awayTeam.logo} alt={stats.awayTeam.name} className="w-12 h-12" />
                    <div>
                      <h4 className="text-xl font-black text-white font-oswald">{stats.awayTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.awayTeam.name}</p>
                    </div>
                  </div>

                  {stats.awayTeam.teamStats && (
                    <div className="space-y-3">
                      {Object.entries(stats.awayTeam.teamStats).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                          <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white font-bold font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOX SCORE */}
          {activeTab === 'boxscore' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-white mb-6 font-oswald uppercase">
                Box Score Completo
              </h3>

              {/* Away Team Box Score */}
              <BoxScoreTable 
                team={stats.awayTeam} 
                showAll={showAllAway} 
                setShowAll={setShowAllAway} 
              />

              {/* Home Team Box Score */}
              <BoxScoreTable 
                team={stats.homeTeam} 
                showAll={showAllHome} 
                setShowAll={setShowAllHome} 
              />
            </div>
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