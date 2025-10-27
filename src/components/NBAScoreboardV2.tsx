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

  // Efeito para carregar os jogos apenas uma vez, quando o componente é montado.
  useEffect(() => {
    loadGames();
  }, []);

  // Este efeito gerencia o intervalo de atualização.
  useEffect(() => {
    const hasLive = games.some(g => g.gameStatus === 2);
    const intervalDuration = hasLive ? 5000 : 30000;

    const interval = setInterval(() => {
      loadGames();
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [games]);

  if (loading || games.length === 0) {
    return (
      <div className="bg-gray-900 py-3 border-b border-gray-700/50 text-center">
        <span className="text-gray-400 text-sm font-medium">
          {loading ? 'Carregando jogos...' : 'Nenhum jogo hoje'}
        </span>
      </div>
    );
  }

  // Mostrar apenas 2 jogos por vez
  const visibleGames = games.slice(currentIndex, currentIndex + 2);

  return (
    <>
      <div className="bg-gray-900 py-4 border-b border-gray-700/50">
        <div className="container mx-auto px-4 flex items-center gap-4">
          {games.length > 2 && (
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className={`w-6 h-6 ${currentIndex === 0 ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>
          )}

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleGames.map((game) => (
              <button
                key={game.gameId}
                onClick={() => {
                  setSelectedGame(game);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-4 border border-gray-700/50 hover:border-pink-500/50 transition-all hover:scale-[1.02] shadow-xl hover:shadow-pink-500/20"
              >
                {/* Badge AO VIVO */}
                {game.gameStatus === 2 && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    AO VIVO
                  </div>
                )}

                {/* Placar Compacto */}
                <div className="space-y-2">
                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={game.awayTeam.logo} 
                        alt={game.awayTeam.teamTricode} 
                        className="w-8 h-8 drop-shadow-lg" 
                      />
                      <div className="text-left">
                        <span className="font-bold text-white text-base block">{game.awayTeam.teamTricode}</span>
                        <span className="text-xs text-gray-400">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                      </div>
                    </div>
                    <span className="font-black text-white text-2xl tabular-nums">{game.awayTeam.score}</span>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={game.homeTeam.logo} 
                        alt={game.homeTeam.teamTricode} 
                        className="w-8 h-8 drop-shadow-lg" 
                      />
                      <div className="text-left">
                        <span className="font-bold text-white text-base block">{game.homeTeam.teamTricode}</span>
                        <span className="text-xs text-gray-400">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                      </div>
                    </div>
                    <span className="font-black text-white text-2xl tabular-nums">{game.homeTeam.score}</span>
                  </div>
                </div>

                {/* Status/Horário */}
                <div className="border-t border-gray-700 mt-3 pt-3 flex items-center justify-between text-xs">
                  <span className={`font-bold ${game.gameStatus === 2 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {game.gameStatus === 2 ? `${game.period}º Quarto • ${game.gameClock}` : game.gameStatusText}
                  </span>
                  <span className="text-gray-400 group-hover:text-pink-400 transition-colors flex items-center gap-1">
                    Ver Estatísticas <Play className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {games.length > 2 && (
            <button
              onClick={() => setCurrentIndex(Math.min(games.length - 2, currentIndex + 1))}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
              disabled={currentIndex >= games.length - 2}
            >
              <ChevronRight className={`w-6 h-6 ${currentIndex >= games.length - 2 ? 'text-gray-600' : 'text-gray-400'}`} />
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