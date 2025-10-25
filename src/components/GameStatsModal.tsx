import { X, TrendingUp, Users, Trophy } from 'lucide-react';

interface Performer {
  name: string;
  value: string;
  fgm?: string;
  fga?: string;
  fg3m?: string;
  fg3a?: string;
  ftm?: string;
  fta?: string;
}

interface TeamPerformers {
  points: Performer[];
  rebounds: Performer[];
  assists: Performer[];
}

interface QuarterScore {
  period: number;
  score: string;
}

interface TeamStats {
  name: string;
  abbreviation: string;
  logo: string;
  score: string;
  record: string;
  performers: TeamPerformers | null;
}

interface GameStats {
  status: string;
  gameState: string;
  gameClock?: string;
  period?: number;
  quarterScores?: {
    home: QuarterScore[];
    away: QuarterScore[];
  } | null;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

export default function GameStatsModal({ isOpen, onClose, stats }: Props) {
  if (!isOpen) return null;

  const { homeTeam, awayTeam, gameState, gameClock, period, quarterScores } = stats;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com placar */}
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-lg p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>

          {/* Placar principal */}
          <div className="flex items-center justify-between gap-4">
            {/* Away Team */}
            <div className="flex items-center gap-4 flex-1">
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-16 h-16 object-contain" />
              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">{awayTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{awayTeam.record}</p>
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-6">
                <span className="text-5xl font-black text-white">{awayTeam.score}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold text-gray-500">VS</span>
                  {gameState === 'in' && (
                    <div className="mt-1">
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                        {period}Q · {gameClock}
                      </span>
                    </div>
                  )}
                  {gameState === 'post' && (
                    <span className="text-sm font-semibold text-green-400 mt-1">Final</span>
                  )}
                </div>
                <span className="text-5xl font-black text-white">{homeTeam.score}</span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-4 flex-1 flex-row-reverse">
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-16 h-16 object-contain" />
              <div className="text-right">
                <h2 className="text-2xl font-bold text-white">{homeTeam.abbreviation}</h2>
                <p className="text-sm text-gray-400">{homeTeam.record}</p>
              </div>
            </div>
          </div>

          {/* Quarter Scores */}
          {quarterScores && (
            <div className="mt-6 text-xs text-gray-400 font-mono grid grid-cols-5 gap-2 text-center">
              <div className="font-bold">TEAM</div>
              <div className="font-bold">1Q</div>
              <div className="font-bold">2Q</div>
              <div className="font-bold">3Q</div>
              <div className="font-bold">4Q</div>
              
              <div className="font-bold text-white">{awayTeam.abbreviation}</div>
              {quarterScores.away.slice(0, 4).map((q, i) => (
                <div key={`away-q-${i}`}>{q.score}</div>
              ))}
              
              <div className="font-bold text-white">{homeTeam.abbreviation}</div>
              {quarterScores.home.slice(0, 4).map((q, i) => (
                <div key={`home-q-${i}`}>{q.score}</div>
              ))}
            </div>
          )}
        </div>

        {/* Content - Top Performers */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Top Performers
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pontos */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-pink-400" /> Pontos</h4>
              {homeTeam.performers?.points && homeTeam.performers.points.slice(0, 2).map((p, i) => (
                <div key={`home-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-pink-400">{p.value}</span>
                  </div>
                  {p.fgm && (
                    <p className="text-xs text-gray-500">
                      {p.fgm}/{p.fga} FG · {p.fg3m}/{p.fg3a} 3P · {p.ftm}/{p.fta} FT
                    </p>
                  )}
                  <p className="text-xs font-bold text-gray-600 mt-1">{homeTeam.abbreviation}</p>
                </div>
              ))}
              <div className="h-px bg-gray-700"></div>
              {awayTeam.performers?.points && awayTeam.performers.points.slice(0, 2).map((p, i) => (
                <div key={`away-pts-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-pink-400">{p.value}</span>
                  </div>
                  {p.fgm && (
                    <p className="text-xs text-gray-500">
                      {p.fgm}/{p.fga} FG · {p.fg3m}/{p.fg3a} 3P · {p.ftm}/{p.fta} FT
                    </p>
                  )}
                  <p className="text-xs font-bold text-gray-600 mt-1">{awayTeam.abbreviation}</p>
                </div>
              ))}
            </div>

            {/* Rebotes */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" /> Rebotes</h4>
              {homeTeam.performers?.rebounds && homeTeam.performers.rebounds.slice(0, 2).map((p, i) => (
                <div key={`home-reb-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-cyan-400">{p.value}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-1">{homeTeam.abbreviation}</p>
                </div>
              ))}
              <div className="h-px bg-gray-700"></div>
              {awayTeam.performers?.rebounds && awayTeam.performers.rebounds.slice(0, 2).map((p, i) => (
                <div key={`away-reb-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-cyan-400">{p.value}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-1">{awayTeam.abbreviation}</p>
                </div>
              ))}
            </div>

            {/* Assistências */}
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
              <h4 className="font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-green-400" /> Assistências</h4>
              {homeTeam.performers?.assists && homeTeam.performers.assists.slice(0, 2).map((p, i) => (
                <div key={`home-ast-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-green-400">{p.value}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-1">{homeTeam.abbreviation}</p>
                </div>
              ))}
              <div className="h-px bg-gray-700"></div>
              {awayTeam.performers?.assists && awayTeam.performers.assists.slice(0, 2).map((p, i) => (
                <div key={`away-ast-${i}`} className="bg-gray-900/70 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{p.name.split(' ').pop()}</span>
                    <span className="text-xl font-black text-green-400">{p.value}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-1">{awayTeam.abbreviation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}