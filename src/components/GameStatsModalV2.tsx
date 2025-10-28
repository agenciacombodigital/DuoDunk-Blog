import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  Trophy, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap,
  Target,
  Clock,
  MapPin,
  UsersRound,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

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

export default function GameStatsModalV2({ game, onClose }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaders' | 'team' | 'boxscore'>('leaders');
  const [showAllHome, setShowAllHome] = useState(false);
  const [showAllAway, setShowAllAway] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('[MODAL] Buscando stats para:', game.gameId);
      
      const { data, error } = await supabase.functions.invoke('nba-game-stats-v3', {
        body: {
          gameId: game.gameId,
          gameStatus: game.gameStatus,
          homeRecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
          awayRecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`,
        }
      });

      if (error) {
        console.error('[MODAL] Erro:', error);
        throw error;
      }
      
      if (data?.isScheduled) {
        setStats({ isScheduled: true });
        return;
      }
      
      if (data?.success) {
        setStats(data.stats);
        console.log('[MODAL] ✅ Stats carregadas:', data.stats);
      }
    } catch (err) {
      console.error('[MODAL] Erro ao carregar stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
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
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-gray-900 rounded-3xl p-8 max-w-md text-center relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
          <Calendar className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Jogo Agendado
          </h2>
          <p className="text-gray-400 mb-6">
            As estatísticas estarão disponíveis assim que o jogo começar.
          </p>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Horário de Início</p>
            <p className="text-lg font-bold text-white">
              {game.gameTimeBrasilia || game.gameStatusText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl"
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
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-lg p-6 z-10 border-b border-gray-700/50">
          {/* Info do Jogo */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{stats.arena} • {stats.city}</span>
            </div>
            {stats.attendance !== 'N/D' && (
              <div className="flex items-center gap-1">
                <UsersRound className="w-3 h-3" />
                <span>{stats.attendance} pessoas</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{stats.gameTimeBrasilia}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1">
              <img 
                src={stats.awayTeam.logo} 
                alt={stats.awayTeam.name} 
                className="w-20 h-20 drop-shadow-lg"
              />
              <div className="text-left">
                <h2 className="text-3xl font-black text-white">{stats.awayTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{stats.awayTeam.name}</p>
                <p className="text-xs text-gray-500">{stats.awayTeam.record}</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-center px-8">
              <div className="flex items-center gap-6">
                <span className="text-6xl font-black text-white tabular-nums">{stats.awayTeam.score}</span>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-gray-500">VS</span>
                  {stats.gameState === 'in' && (
                    <div className="mt-2">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        {stats.period}Q • {stats.gameClock}
                      </span>
                    </div>
                  )}
                  {stats.gameState === 'post' && (
                    <span className="text-sm font-bold text-green-400 mt-2">FINAL</span>
                  )}
                  {stats.gameState === 'pre' && (
                    <span className="text-sm font-bold text-cyan-400 mt-2">{stats.status}</span>
                  )}
                </div>
                <span className="text-6xl font-black text-white tabular-nums">{stats.homeTeam.score}</span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1 flex-row-reverse">
              <img 
                src={stats.homeTeam.logo} 
                alt={stats.homeTeam.name} 
                className="w-20 h-20 drop-shadow-lg"
              />
              <div className="text-right">
                <h2 className="text-3xl font-black text-white">{stats.homeTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{stats.homeTeam.name}</p>
                <p className="text-xs text-gray-500">{stats.homeTeam.record}</p>
              </div>
            </div>
          </div>

          {/* Quarter Scores */}
          {stats.quarterScores && stats.quarterScores.away.length > 0 && (
            <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
              <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
                <div className="font-bold text-gray-400">TIME</div>
                <div className="font-bold text-gray-400">1Q</div>
                <div className="font-bold text-gray-400">2Q</div>
                <div className="font-bold text-gray-400">3Q</div>
                <div className="font-bold text-gray-400">4Q</div>
                <div className="font-bold text-white">TOTAL</div>

                <div className="font-bold text-white">{stats.awayTeam.abbreviation}</div>
                {stats.quarterScores.away.slice(0, 4).map((q: any, i: number) => (
                  <div key={`away-q-${i}`} className="text-gray-300">{q.score}</div>
                ))}
                <div className="font-black text-white text-base">{stats.awayTeam.score}</div>

                <div className="font-bold text-white">{stats.homeTeam.abbreviation}</div>
                {stats.quarterScores.home.slice(0, 4).map((q: any, i: number) => (
                  <div key={`home-q-${i}`} className="text-gray-300">{q.score}</div>
                ))}
                <div className="font-black text-white text-base">{stats.homeTeam.score}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab('leaders')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'leaders'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Destaques
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'team'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Stats do Time
            </button>
            <button
              onClick={() => setActiveTab('boxscore')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'boxscore'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Box Score
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* TAB: DESTAQUES */}
          {activeTab === 'leaders' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-400" />
                Destaques
              </h3>

              {/* Pontos */}
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-pink-400" />
                  Pontos
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Home Team Points */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 mb-2">{stats.homeTeam.abbreviation}</p>
                    {stats.homeTeam.performers?.points?.slice(0, 5).map((p: any, i: number) => (
                      <div key={`home-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">#{p.jerseyNum}</span>
                            <span className="font-bold text-white text-sm">{p.nameI}</span>
                            <span className="text-xs text-gray-500">{p.position}</span>
                          </div>
                          <span className="text-2xl font-black text-pink-400">{p.value}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{p.fgm}/{p.fga} FG ({p.fgPct}%)</span>
                          <span>{p.fg3m}/{p.fg3a} 3P ({p.fg3Pct}%)</span>
                          <span>{p.ftm}/{p.fta} FT ({p.ftPct}%)</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span>{p.reboundsTotal} REB</span>
                          <span>{p.assists} AST</span>
                          <span>{p.minutesCalculated} MIN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Away Team Points */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-400 mb-2">{stats.awayTeam.abbreviation}</p>
                    {stats.awayTeam.performers?.points?.slice(0, 5).map((p: any, i: number) => (
                      <div key={`away-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">#{p.jerseyNum}</span>
                            <span className="font-bold text-white text-sm">{p.nameI}</span>
                            <span className="text-xs text-gray-500">{p.position}</span>
                          </div>
                          <span className="text-2xl font-black text-pink-400">{p.value}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{p.fgm}/{p.fga} FG ({p.fgPct}%)</span>
                          <span>{p.fg3m}/{p.fg3a} 3P ({p.fg3Pct}%)</span>
                          <span>{p.ftm}/{p.fta} FT ({p.ftPct}%)</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span>{p.reboundsTotal} REB</span>
                          <span>{p.assists} AST</span>
                          <span>{p.minutesCalculated} MIN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rebotes, Assistências e Outras Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rebotes */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Rebotes
                  </h4>
                  <div className="space-y-2">
                    {[...stats.homeTeam.performers?.rebounds?.slice(0, 3) || [], ...stats.awayTeam.performers?.rebounds?.slice(0, 3) || []].map((p: any, i: number) => (
                      <div key={`reb-${i}`} className="bg-gray-900/70 p-2 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-sm block">{p.nameI}</span>
                          <span className="text-xs text-gray-500">{p.position}</span>
                        </div>
                        <span className="text-xl font-black text-cyan-400">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assistências */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    Assistências
                  </h4>
                  <div className="space-y-2">
                    {[...stats.homeTeam.performers?.assists?.slice(0, 3) || [], ...stats.awayTeam.performers?.assists?.slice(0, 3) || []].map((p: any, i: number) => (
                      <div key={`ast-${i}`} className="bg-gray-900/70 p-2 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-sm block">{p.nameI}</span>
                          <span className="text-xs text-gray-500">{p.position}</span>
                        </div>
                        <span className="text-xl font-black text-green-400">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roubos de Bola */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Roubos de Bola
                  </h4>
                  <div className="space-y-2">
                    {[...stats.homeTeam.performers?.steals?.slice(0, 3) || [], ...stats.awayTeam.performers?.steals?.slice(0, 3) || []].map((p: any, i: number) => (
                      <div key={`stl-${i}`} className="bg-gray-900/70 p-2 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-sm block">{p.nameI}</span>
                          <span className="text-xs text-gray-500">{p.position}</span>
                        </div>
                        <span className="text-xl font-black text-yellow-400">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tocos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    Tocos
                  </h4>
                  <div className="space-y-2">
                    {[...stats.homeTeam.performers?.blocks?.slice(0, 3) || [], ...stats.awayTeam.performers?.blocks?.slice(0, 3) || []].map((p: any, i: number) => (
                      <div key={`blk-${i}`} className="bg-gray-900/70 p-2 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-sm block">{p.nameI}</span>
                          <span className="text-xs text-gray-500">{p.position}</span>
                        </div>
                        <span className="text-xl font-black text-purple-400">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plus/Minus */}
                <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700/50">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Plus/Minus (+/-)
                  </h4>
                  <div className="space-y-2">
                    {[...stats.homeTeam.performers?.plusMinus?.slice(0, 3) || [], ...stats.awayTeam.performers?.plusMinus?.slice(0, 3) || []].map((p: any, i: number) => (
                      <div key={`pm-${i}`} className="bg-gray-900/70 p-2 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white text-sm block">{p.nameI}</span>
                          <span className="text-xs text-gray-500">{p.position}</span>
                        </div>
                        <span className={`text-xl font-black ${parseInt(p.plusMinusPoints) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {parseInt(p.plusMinusPoints) >= 0 ? '+' : ''}{p.plusMinusPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STATS DO TIME */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Target className="w-7 h-7 text-pink-400" />
                Estatísticas dos Times
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Home Team Stats */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={stats.homeTeam.logo} alt={stats.homeTeam.name} className="w-12 h-12" />
                    <div>
                      <h4 className="text-xl font-black text-white">{stats.homeTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.homeTeam.name}</p>
                    </div>
                  </div>

                  {stats.homeTeam.teamStats && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Cestas de Quadra</span>
                        <span className="text-white font-bold">
                          {stats.homeTeam.teamStats.fieldGoals} ({stats.homeTeam.teamStats.fieldGoalPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">3 Pontos</span>
                        <span className="text-white font-bold">
                          {stats.homeTeam.teamStats.threePointers} ({stats.homeTeam.teamStats.threePointerPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Lances Livres</span>
                        <span className="text-white font-bold">
                          {stats.homeTeam.teamStats.freeThrows} ({stats.homeTeam.teamStats.freeThrowPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Rebotes</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.rebounds}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Assistências</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.assists}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Roubos de Bola</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.steals}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Tocos</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.blocks}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Turnovers</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.turnovers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Faltas</span>
                        <span className="text-white font-bold">{stats.homeTeam.teamStats.fouls}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Away Team Stats */}
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={stats.awayTeam.logo} alt={stats.awayTeam.name} className="w-12 h-12" />
                    <div>
                      <h4 className="text-xl font-black text-white">{stats.awayTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.awayTeam.name}</p>
                    </div>
                  </div>

                  {stats.awayTeam.teamStats && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Cestas de Quadra</span>
                        <span className="text-white font-bold">
                          {stats.awayTeam.teamStats.fieldGoals} ({stats.awayTeam.teamStats.fieldGoalPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">3 Pontos</span>
                        <span className="text-white font-bold">
                          {stats.awayTeam.teamStats.threePointers} ({stats.awayTeam.teamStats.threePointerPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Lances Livres</span>
                        <span className="text-white font-bold">
                          {stats.awayTeam.teamStats.freeThrows} ({stats.awayTeam.teamStats.freeThrowPct}%)
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Rebotes</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.rebounds}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Assistências</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.assists}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Roubos de Bola</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.steals}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Tocos</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.blocks}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Turnovers</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.turnovers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-900/70 rounded-lg">
                        <span className="text-gray-400 text-sm">Faltas</span>
                        <span className="text-white font-bold">{stats.awayTeam.teamStats.fouls}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOX SCORE */}
          {activeTab === 'boxscore' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                <Users className="w-7 h-7 text-pink-400" />
                Box Score Completo
              </h3>

              {/* Away Team Box Score */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={stats.awayTeam.logo} alt={stats.awayTeam.name} className="w-10 h-10" />
                    <div>
                      <h4 className="text-xl font-black text-white">{stats.awayTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.awayTeam.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllAway(!showAllAway)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition-colors"
                  >
                    {showAllAway ? 'Mostrar Menos' : 'Ver Todos'}
                    {showAllAway ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2 text-gray-400 font-bold">JOGADOR</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">MIN</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">PTS</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">REB</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">AST</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">STL</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">BLK</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">TO</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">FG</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">3P</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">FT</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.awayTeam.allPlayers?.slice(0, showAllAway ? undefined : 8).map((player: any, i: number) => (
                        <tr 
                          key={`away-player-${i}`}
                          className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                            player.starter ? 'bg-gray-800/30' : ''
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">#{player.jerseyNum}</span>
                              <div>
                                <span className="font-bold text-white text-sm block">{player.nameI}</span>
                                <span className="text-xs text-gray-500">{player.position}</span>
                              </div>
                              {player.starter && (
                                <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-bold">
                                  TITULAR
                                </span>
                              )}
                              {player.oncourt && (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">
                                  EM QUADRA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.minutes}
                          </td>
                          <td className="text-center py-3 px-2 text-white font-bold">
                            {player.stats.points}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.rebounds}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.assists}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.steals}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.blocks}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.turnovers}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.fgm}/{player.stats.fga}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.fg3m}/{player.stats.fg3a}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.ftm}/{player.stats.fta}
                          </td>
                          <td className={`text-center py-3 px-2 font-bold ${
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

              {/* Home Team Box Score */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={stats.homeTeam.logo} alt={stats.homeTeam.name} className="w-10 h-10" />
                    <div>
                      <h4 className="text-xl font-black text-white">{stats.homeTeam.abbreviation}</h4>
                      <p className="text-xs text-gray-400">{stats.homeTeam.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAllHome(!showAllHome)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-bold transition-colors"
                  >
                    {showAllHome ? 'Mostrar Menos' : 'Ver Todos'}
                    {showAllHome ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-2 text-gray-400 font-bold">JOGADOR</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">MIN</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">PTS</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">REB</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">AST</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">STL</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">BLK</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">TO</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">FG</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">3P</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">FT</th>
                        <th className="text-center py-3 px-2 text-gray-400 font-bold">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.homeTeam.allPlayers?.slice(0, showAllHome ? undefined : 8).map((player: any, i: number) => (
                        <tr 
                          key={`home-player-${i}`}
                          className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                            player.starter ? 'bg-gray-800/30' : ''
                          }`}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">#{player.jerseyNum}</span>
                              <div>
                                <span className="font-bold text-white text-sm block">{player.nameI}</span>
                                <span className="text-xs text-gray-500">{player.position}</span>
                              </div>
                              {player.starter && (
                                <span className="text-[10px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-bold">
                                  TITULAR
                                </span>
                              )}
                              {player.oncourt && (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">
                                  EM QUADRA
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.minutes}
                          </td>
                          <td className="text-center py-3 px-2 text-white font-bold">
                            {player.stats.points}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.rebounds}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.assists}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.steals}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.blocks}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300">
                            {player.stats.turnovers}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.fgm}/{player.stats.fga}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.fg3m}/{player.stats.fg3a}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-300 font-mono text-xs">
                            {player.stats.ftm}/{player.stats.fta}
                          </td>
                          <td className={`text-center py-3 px-2 font-bold ${
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

              {/* Legenda */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <h5 className="font-bold text-white text-sm mb-3">Legenda:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-400">
                  <div><span className="font-bold text-white">MIN</span> = Minutos</div>
                  <div><span className="font-bold text-white">PTS</span> = Pontos</div>
                  <div><span className="font-bold text-white">REB</span> = Rebotes</div>
                  <div><span className="font-bold text-white">AST</span> = Assistências</div>
                  <div><span className="font-bold text-white">STL</span> = Roubos de Bola</div>
                  <div><span className="font-bold text-white">BLK</span> = Tocos</div>
                  <div><span className="font-bold text-white">TO</span> = Turnovers</div>
                  <div><span className="font-bold text-white">FG</span> = Cestas de Quadra</div>
                  <div><span className="font-bold text-white">3P</span> = Três Pontos</div>
                  <div><span className="font-bold text-white">FT</span> = Lances Livres</div>
                  <div><span className="font-bold text-white">+/-</span> = Plus/Minus</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700/50 p-4 text-center">
          <p className="text-gray-400 text-xs">
            🏀 Dados em tempo real da NBA • Atualizado a cada 5 segundos durante jogos ao vivo
          </p>
          <p className="text-gray-500 text-xs mt-1">
            <strong className="text-pink-400">DuoDunk</strong> - O Maior Blog de NBA do Brasil 🇧🇷
          </p>
        </div>
      </div>
    </div>
  );
}