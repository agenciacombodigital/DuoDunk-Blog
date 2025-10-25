import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import GameStatsModal from './GameStatsModal';

interface Game {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
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

interface GameStats {
  status: string;
  gameState: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: string;
    record: string;
    performers: any;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: string;
    record: string;
    performers: any;
  };
}

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameStats, setGameStats] = useState<{ success: boolean, stats: GameStats } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadGameStats(selectedGame);
    }
  }, [selectedGame]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-scoreboard');
      
      if (error) {
        console.error('❌ Erro:', error);
        setGames([]);
        return;
      }

      if (data?.scoreboard?.games && Array.isArray(data.scoreboard.games) && data.scoreboard.games.length > 0) {
        const processedGames = data.scoreboard.games.map((game: any) => ({
          gameId: game.gameId,
          gameStatus: game.gameStatus,
          gameStatusText: game.gameStatusText,
          homeTeam: {
            teamName: game.homeTeam.teamName,
            teamTricode: game.homeTeam.teamTricode,
            score: game.homeTeam.score?.toString() || '0',
            wins: game.homeTeam.wins,
            losses: game.homeTeam.losses,
            logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
          },
          awayTeam: {
            teamName: game.awayTeam.teamName,
            teamTricode: game.awayTeam.teamTricode,
            score: game.awayTeam.score?.toString() || '0',
            wins: game.awayTeam.wins,
            losses: game.awayTeam.losses,
            logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
          },
        }));
        setGames(processedGames);
      } else {
        setGames([]);
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGameStats = async (game: Game) => {
    setLoadingStats(true);
    setGameStats(null);
    try {
      const { data, error } = await supabase.functions.invoke('nba-game-stats-v3', {
        body: { 
          gameId: game.gameId,
          homeRecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
          awayRecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`,
        }
      });

      if (error) throw error;
      if (data?.success) {
        setGameStats(data);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar stats:', err);
      setGameStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const nextGames = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const step = isMobile ? 1 : 2;
    setCurrentIndex((prev) => (prev + step >= games.length ? 0 : prev + step));
  };

  const prevGames = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const step = isMobile ? 1 : 2;
    setCurrentIndex((prev) => (prev - step < 0 ? Math.max(0, games.length - step) : prev - step));
  };

  const teamColors: { [key: string]: { primary: string; secondary: string } } = {
    LAL: { primary: 'from-purple-600 to-yellow-500', secondary: 'bg-purple-600' },
    GSW: { primary: 'from-blue-600 to-yellow-400', secondary: 'bg-blue-600' },
    BOS: { primary: 'from-green-600 to-green-400', secondary: 'bg-green-600' },
    MIA: { primary: 'from-red-600 to-black', secondary: 'bg-red-600' },
    CHI: { primary: 'from-red-600 to-black', secondary: 'bg-red-600' },
    HOU: { primary: 'from-red-600 to-gray-800', secondary: 'bg-red-600' },
    OKC: { primary: 'from-blue-500 to-orange-500', secondary: 'bg-blue-500' },
    NYK: { primary: 'from-blue-600 to-orange-500', secondary: 'bg-blue-600' },
    BKN: { primary: 'from-black to-gray-800', secondary: 'bg-black' },
    CLE: { primary: 'from-red-800 to-yellow-600', secondary: 'bg-red-800' },
    CHA: { primary: 'from-teal-500 to-purple-600', secondary: 'bg-teal-500' },
  };

  const getTeamGradient = (tricode: string) => {
    return teamColors[tricode]?.primary || 'from-gray-700 to-gray-900';
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-6 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
            </div>
            <span className="text-gray-300 text-sm font-medium">Carregando jogos da NBA...</span>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-4 border-b border-gray-700/50">
        <div className="container mx-auto px-4 text-center">
          <span className="text-gray-400 text-sm font-medium inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Nenhum jogo da NBA hoje 🏀
          </span>
        </div>
      </div>
    );
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const gamesPerView = isMobile ? 1 : 2;
  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-5 border-b border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {games.length > 1 && (
              <button
                onClick={prevGames}
                className="group p-2 sm:p-3 hover:bg-white/5 rounded-full transition-all duration-300 flex-shrink-0 backdrop-blur-sm border border-white/10 hover:border-pink-500/50"
                aria-label="Jogos anteriores"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </button>
            )}

            <div className="flex-1 flex gap-3 sm:gap-6 justify-start sm:justify-center overflow-x-auto px-2 sm:px-0 snap-x snap-mandatory scrollbar-hide">
              {visibleGames.map((game) => (
                <button
                  key={game.gameId}
                  onClick={() => setSelectedGame(game)}
                  className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center gap-3 sm:gap-4 md:gap-6 min-w-[calc(100vw-4rem)] sm:min-w-[480px] md:min-w-[520px] lg:min-w-[560px] max-w-[92vw] sm:max-w-[48%] md:max-w-[45%] flex-shrink-0 snap-center hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 border border-white/10 hover:border-pink-500/50 shadow-2xl hover:shadow-pink-500/20 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  
                  <div className="relative flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-r ${getTeamGradient(game.awayTeam.teamTricode)} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                      <img src={game.awayTeam.logo} alt={game.awayTeam.teamTricode} className="relative w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-bold text-white text-sm sm:text-base md:text-lg tracking-tight">{game.awayTeam.teamTricode}</span>
                      <span className="hidden sm:block text-[10px] md:text-xs text-gray-400 font-medium max-w-[80px] truncate">{game.awayTeam.teamName}</span>
                    </div>
                    <span className="ml-auto text-xl sm:text-2xl font-black text-white group-hover:text-pink-400 transition-colors flex-shrink-0">{game.awayTeam.score}</span>
                  </div>

                  <div className="relative flex flex-col items-center px-3 sm:px-6 border-x border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                      <span className="text-xs sm:text-sm font-bold text-pink-400 tracking-wide whitespace-nowrap">{game.gameStatusText}</span>
                    </div>
                    <span className="hidden sm:block text-xs text-gray-500 font-medium whitespace-nowrap">Horário de Brasília</span>
                    {game.gameStatus === 2 && (
                      <div className="absolute -top-1 right-0">
                        <div className="relative">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center gap-2 sm:gap-3 flex-1 flex-row-reverse">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-r ${getTeamGradient(game.homeTeam.teamTricode)} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                      <img src={game.homeTeam.logo} alt={game.homeTeam.teamTricode} className="relative w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-right min-w-0">
                      <span className="block font-bold text-white text-sm sm:text-base md:text-lg tracking-tight">{game.homeTeam.teamTricode}</span>
                      <span className="hidden sm:block text-[10px] md:text-xs text-gray-400 font-medium max-w-[80px] truncate">{game.homeTeam.teamName}</span>
                    </div>
                    <span className="mr-auto text-xl sm:text-2xl font-black text-white group-hover:text-pink-400 transition-colors flex-shrink-0">{game.homeTeam.score}</span>
                  </div>

                  <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-500 font-medium">Clique para detalhes</span>
                  </div>
                </button>
              ))}
            </div>

            {games.length > 1 && (
              <button
                onClick={nextGames}
                className="group p-2 sm:p-3 hover:bg-white/5 rounded-full transition-all duration-300 flex-shrink-0 backdrop-blur-sm border border-white/10 hover:border-pink-500/50"
                aria-label="Próximos jogos"
              >
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Logic */}
      {selectedGame && (
        loadingStats ? (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
            </div>
            <span className="ml-4 text-gray-300">Carregando estatísticas...</span>
          </div>
        ) : gameStats ? (
          <GameStatsModal
            isOpen={!!selectedGame}
            onClose={() => setSelectedGame(null)}
            stats={gameStats.stats}
          />
        ) : (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedGame(null)}
          >
              <div 
                  className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-md w-full p-8 border border-white/10 shadow-2xl text-center"
                  onClick={(e) => e.stopPropagation()}
              >
                  <TrendingUp className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">
                      Estatísticas em Breve
                  </h4>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      As estatísticas detalhadas estarão disponíveis assim que o jogo começar!
                  </p>
              </div>
          </div>
        )
      )}
    </>
  );
}