import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, TrendingUp, Users, Trophy, Clock, Activity } from 'lucide-react';

interface Game {
  gameId: string;
  gameStatus: number;
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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await supabase.functions.invoke('nba-game-stats-v3', {
        body: {
          gameId: game.gameId,
          homeRecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
          awayRecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`,
        }
      });

      if (data?.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
        >
          <X className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>

        {/* Header com Placar */}
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-lg p-6 z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1">
              <img src={stats.awayTeam.logo} alt={stats.awayTeam.name} className="w-16 h-16" />
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">{stats.awayTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{stats.awayTeam.record}</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-6">
                <span className="text-5xl font-black text-white">{stats.awayTeam.score}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-gray-500">VS</span>
                  {stats.gameState === 'in' && (
                    <div className="mt-1">
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                        {stats.period}Q · {stats.gameClock}
                      </span>
                    </div>
                  )}
                  {stats.gameState === 'post' && (
                    <span className="text-sm font-semibold text-green-400 mt-1">FINAL</span>
                  )}
                </div>
                <span className="text-5xl font-black text-white">{stats.homeTeam.score}</span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1 flex-row-reverse">
              <img src={stats.homeTeam.logo} alt={stats.homeTeam.name} className="w-16 h-16" />
              <div className="text-right">
                <h2 className="text-2xl font-bold text-white">{stats.homeTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{stats.homeTeam.record}</p>
              </div>
            </div>
          </div>

          {/* Quarter Scores */}
          {stats.quarterScores && (
            <div className="mt-6 text-xs text-gray-400 font-mono grid grid-cols-6 gap-2 text-center">
              <div className="font-bold">TEAM</div>
              <div className="font-bold">1Q</div>
              <div className="font-bold">2Q</div>
              <div className="font-bold">3Q</div>
              <div className="font-bold">4Q</div>
              <div className="font-bold text-white">T</div>

              <div className="font-bold text-white">{stats.awayTeam.abbreviation}</div>
              {stats.quarterScores.away.slice(0, 4).map((q: any, i: number) => (
                <div key={`away-q-${i}`}>{q.score}</div>
              ))}
              <div className="font-bold text-white">{stats.awayTeam.score}</div>

              <div className="font-bold text-white">{stats.homeTeam.abbreviation}</div>
              {stats.quarterScores.home.slice(0, 4).map((q: any, i: number) => (
                <div key={`home-q-${i}`}>{q.score}</div>
              ))}
              <div className="font-bold text-white">{stats.homeTeam.score}</div>
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Top Performers
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pontos */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-pink-400" /> Pontos</h4>
              <div className="space-y-2">
                {stats.homeTeam.performers?.points?.slice(0, 2).map((p: any, i: number) => (
                  <div key={`home-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-xl font-black text-pink-400">{p.value}</span>
                    </div>
                    {p.fgm && (
                      <p className="text-xs text-gray-500">
                        {p.fgm}/{p.fga} FG · {p.fg3m}/{p.fg3a} 3P · {p.ftm}/{p.fta} FT
                      </p>
                    )}
                    <p className="text-xs font-bold text-gray-600 mt-1">{stats.homeTeam.abbreviation}</p>
                  </div>
                ))}
                {stats.awayTeam.performers?.points?.slice(0, 2).map((p: any, i: number) => (
                  <div key={`away-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-xl font-black text-pink-400">{p.value}</span>
                    </div>
                    {p.fgm && (
                      <p className="text-xs text-gray-500">
                        {p.fgm}/{p.fga} FG · {p.fg3m}/{p.fg3a} 3P · {p.ftm}/{p.fta} FT
                      </p>
                    )}
                    <p className="text-xs font-bold text-gray-600 mt-1">{stats.awayTeam.abbreviation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rebotes */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /> Rebotes</h4>
              <div className="space-y-2">
                {[...stats.homeTeam.performers?.rebounds?.slice(0, 2) || [], ...stats.awayTeam.performers?.rebounds?.slice(0, 2) || []].map((p: any, i: number) => (
                  <div key={`reb-${i}`} className="bg-gray-900/70 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-xl font-black text-cyan-400">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assistências */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-green-400" /> Assistências</h4>
              <div className="space-y-2">
                {[...stats.homeTeam.performers?.assists?.slice(0, 2) || [], ...stats.awayTeam.performers?.assists?.slice(0, 2) || []].map((p: any, i: number) => (
                  <div key={`ast-${i}`} className="bg-gray-900/70 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-xl font-black text-green-400">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}