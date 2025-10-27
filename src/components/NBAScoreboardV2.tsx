import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import GameStatsModalV2 from './GameStatsModalV2';

interface Game {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameClock: string;
  period: number;
  homeTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    wins: number;
    losses: number;
    logo: string;
  };
  awayTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    wins: number;
    losses: number;
    logo: string;
  };
}

export default function NBAScoreboardV2() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadGames();
    const interval = setInterval(() => {
      const hasLive = games.some(g => g.gameStatus === 2);
      loadGames();
    }, hasLive ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [games]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-scoreboard-v2');
      if (error) throw error;
      
      if (data?.success && data?.scoreboard?.games) {
        const processed = data.scoreboard.games.map((g: any) => ({
          gameId: g.gameId,
          gameStatus: g.gameStatus,
          gameStatusText: g.gameStatusText,
          gameClock: g.gameClock,
          period: g.period,
          homeTeam: {
            teamName: g.homeTeam.teamName,
            teamTricode: g.homeTeam.teamTricode,
            score: String(g.homeTeam.score),
            wins: g.homeTeam.wins,
            losses: g.homeTeam.losses,
            logo: `https://cdn.nba.com/logos/nba/${g.homeTeam.teamId}/primary/L/logo.svg`,
          },
          awayTeam: {
            teamName: g.awayTeam.teamName,
            teamTricode: g.awayTeam.teamTricode,
            score: String(g.awayTeam.score),
            wins: g.awayTeam.wins,
            losses: g.awayTeam.losses,
            logo: `https://cdn.nba.com/logos/nba/${g.awayTeam.teamId}/primary/L/logo.svg`,
          },
        }));
        setGames(processed);
      }
    } catch (err) {
      console.error('[SCOREBOARD-V2] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || games.length === 0) {
    return (
      <div className="bg-gray-900 py-3 border-b border-gray-700/50 text-center">
        <span className="text-gray-400 text-sm font-medium">
          {loading ? 'Carregando jogos...' : 'Nenhum jogo hoje'}
        </span>
      </div>
    );
  }

  const visibleGames = games.slice(currentIndex, currentIndex + 3);

  return (
    <>
      <div className="bg-gray-900 py-3 border-b border-gray-700/50">
        <div className="container mx-auto px-4 flex items-center gap-4">
          {games.length > 3 && (
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className={`w-5 h-5 ${currentIndex === 0 ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>
          )}

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleGames.map((game) => (
              <button
                key={game.gameId}
                onClick={() => {
                  setSelectedGame(game);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-3 border border-gray-700/50 hover:border-pink-500/50 transition-all hover:scale-[1.02]"
              >
                {/* Badge AO VIVO */}
                {game.gameStatus === 2 && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                    AO VIVO
                  </div>
                )}

                {/* Placar Compacto */}
                <div className="space-y-1.5">
                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={game.awayTeam.logo} alt={game.awayTeam.teamTricode} className="w-6 h-6" />
                      <span className="font-bold text-white text-sm">{game.awayTeam.teamTricode}</span>
                      <span className="text-xs text-gray-400">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                    </div>
                    <span className="font-black text-white text-lg">{game.awayTeam.score}</span>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={game.homeTeam.logo} alt={game.homeTeam.teamTricode} className="w-6 h-6" />
                      <span className="font-bold text-white text-sm">{game.homeTeam.teamTricode}</span>
                      <span className="text-xs text-gray-400">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                    </div>
                    <span className="font-black text-white text-lg">{game.homeTeam.score}</span>
                  </div>
                </div>

                {/* Status/Horário */}
                <div className="border-t border-gray-700 mt-2 pt-2 flex items-center justify-between text-xs">
                  <span className={`font-bold ${game.gameStatus === 2 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {game.gameStatus === 2 ? `${game.period}Q ${game.gameClock}` : game.gameStatusText}
                  </span>
                  <span className="text-gray-400 group-hover:text-pink-400 transition-colors flex items-center gap-1">
                    Ver Jogo <Play className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {games.length > 3 && (
            <button
              onClick={() => setCurrentIndex(Math.min(games.length - 3, currentIndex + 1))}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              disabled={currentIndex >= games.length - 3}
            >
              <ChevronRight className={`w-5 h-5 ${currentIndex >= games.length - 3 ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>
          )}
        </div>
      </div>

      {isModalOpen && selectedGame && (
        <GameStatsModalV2
          game={selectedGame}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGame(null);
          }}
        />
      )}
    </>
  );
}