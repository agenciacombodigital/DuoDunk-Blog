import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, X, TrendingUp, Clock, Trophy, Target, Users } from 'lucide-react';

interface Game {
  gameId: string;
  gameStatus: string;
  gameStatusText: string;
  homeTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    logo: string;
  };
  awayTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    logo: string;
  };
}

interface GameStats {
  status: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: string;
    leaders: {
      points: { displayName: string; value: string; } | null;
      rebounds: { displayName: string; value: string; } | null;
      assists: { displayName: string; value: string; } | null;
    };
    players: any[];
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo: string;
    score: string;
    leaders: {
      points: { displayName: string; value: string; } | null;
      rebounds: { displayName: string; value: string; } | null;
      assists: { displayName: string; value: string; } | null;
    };
    players: any[];
  };
}

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carregar estatísticas quando selecionar jogo
  useEffect(() => {
    if (selectedGame) {
      loadGameStats(selectedGame.gameId);
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

      if (data?.games && Array.isArray(data.games) && data.games.length > 0) {
        // Converter horários para Brasília (UTC-3)
        const gamesWithBrasiliaTime = data.games.map((game: Game) => {
          const utcTime = game.gameStatusText;
          
          // Extrair hora do formato "Tue, October 21st at 7:30 PM EDT"
          const timeMatch = utcTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2];
            const period = timeMatch[3].toUpperCase();
            
            // Converter para 24h
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            // EDT é UTC-4, então soma 4 para ter UTC
            // Depois subtrai 3 para ter Brasília (UTC-3)
            // Resultado: +1 hora
            hours += 1;
            
            // Formatar para horário de Brasília
            const brasiliaTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            
            return {
              ...game,
              gameStatusText: brasiliaTime
            };
          }
          
          return game;
        });
        
        setGames(gamesWithBrasiliaTime);
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

  const loadGameStats = async (gameId: string) => {
    setLoadingStats(true);
    try {
      console.log('📊 Buscando estatísticas do jogo:', gameId);
      
      const { data, error } = await supabase.functions.invoke('nba-game-stats', {
        body: { gameId }
      });

      if (error) {
        console.error('❌ Erro ao buscar stats:', error);
        setGameStats(null);
        return;
      }

      if (data?.success && data?.stats) {
        console.log('✅ Estatísticas carregadas:', data.stats);
        setGameStats(data.stats);
      } else {
        console.log('ℹ️ Sem estatísticas disponíveis');
        setGameStats(null);
      }
    } catch (err) {
      console.error('❌ Erro:', err);
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
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
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

  // No mobile: 1 jogo por vez | No desktop: 2 jogos por vez
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const gamesPerView = isMobile ? 1 : 2;
  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-5 border-b border-gray-700/50 backdrop-blur-xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCAzOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Botão Anterior */}
            {games.length > 1 && (
              <button
                onClick={prevGames}
                className="group p-3 hover:bg-white/5 rounded-full transition-all duration-300 flex-shrink-0 backdrop-blur-sm border border-white/10 hover:border-pink-500/50 hidden sm:block"
                aria-label="Jogos anteriores"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </button>
            )}

            {/* Lista de Jogos */}
            <div className="flex-1 flex gap-3 sm:gap-6 justify-start sm:justify-center overflow-x-auto px-2 sm:px-0 snap-x snap-mandatory">
              {visibleGames.map((game) => (
                <button
                  key={game.gameId}
                  onClick={() => setSelectedGame(game)}
                  className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl 
                             px-4 sm:px-8 py-4 sm:py-5 
                             flex items-center gap-3 sm:gap-6 
                             min-w-[calc(100vw-2rem)] sm:min-w-[400px] 
                             flex-shrink-0 snap-center
                             hover:scale-105 transition-all duration-300 
                             border border-white/10 hover:border-pink-500/50 
                             shadow-2xl hover:shadow-pink-500/20 cursor-pointer"
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                  
                  {/* Time Visitante */}
                  <div className="relative flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-r ${getTeamGradient(game.awayTeam.teamTricode)} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                      <img 
                        src={game.awayTeam.logo} 
                        alt={game.awayTeam.teamTricode}
                        className="relative w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-bold text-white text-base sm:text-xl tracking-tight truncate">
                        {game.awayTeam.teamTricode}
                      </span>
                      <span className="hidden sm:block text-xs text-gray-400 font-medium truncate">
                        {game.awayTeam.teamName}
                      </span>
                    </div>
                    <span className="ml-auto text-2xl sm:text-3xl font-black text-white group-hover:text-pink-400 transition-colors flex-shrink-0">
                      {game.awayTeam.score}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="relative flex flex-col items-center px-3 sm:px-6 border-x border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                      <span className="text-xs sm:text-sm font-bold text-pink-400 tracking-wide whitespace-nowrap">
                        {game.gameStatusText}
                      </span>
                    </div>
                    <span className="hidden sm:block text-xs text-gray-500 font-medium whitespace-nowrap">
                      Horário de Brasília
                    </span>
                    {game.gameStatus === 'in' && (
                      <div className="absolute -top-1 right-0">
                        <div className="relative">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Mandante */}
                  <div className="relative flex items-center gap-2 sm:gap-3 flex-1 flex-row-reverse">
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 bg-gradient-to-r ${getTeamGradient(game.homeTeam.teamTricode)} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                      <img 
                        src={game.homeTeam.logo} 
                        alt={game.homeTeam.teamTricode}
                        className="relative w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="text-right min-w-0">
                      <span className="block font-bold text-white text-base sm:text-xl tracking-tight truncate">
                        {game.homeTeam.teamTricode}
                      </span>
                      <span className="hidden sm:block text-xs text-gray-400 font-medium truncate">
                        {game.homeTeam.teamName}
                      </span>
                    </div>
                    <span className="mr-auto text-2xl sm:text-3xl font-black text-white group-hover:text-pink-400 transition-colors flex-shrink-0">
                      {game.homeTeam.score}
                    </span>
                  </div>

                  {/* Click Indicator - Esconder no mobile */}
                  <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-500 font-medium">Clique para detalhes</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Botão Próximo */}
            {games.length > 1 && (
              <button
                onClick={nextGames}
                className="group p-3 hover:bg-white/5 rounded-full transition-all duration-300 flex-shrink-0 backdrop-blur-sm border border-white/10 hover:border-pink-500/50 hidden sm:block"
                aria-label="Próximos jogos"
              >
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedGame && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedGame(null)}
        >
          <div 
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-white/10 shadow-2xl animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-8 border-b border-white/10">
              <button
                onClick={() => setSelectedGame(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
              
              <div className="flex items-center justify-between gap-8">
                {/* Time Visitante */}
                <div className="flex items-center gap-4 flex-1">
                  <img 
                    src={selectedGame.awayTeam.logo} 
                    alt={selectedGame.awayTeam.teamTricode}
                    className="w-20 h-20 object-contain drop-shadow-2xl"
                  />
                  <div>
                    <h3 className="text-3xl font-black text-white mb-1">
                      {selectedGame.awayTeam.teamTricode}
                    </h3>
                    <p className="text-gray-400 font-medium">
                      {selectedGame.awayTeam.teamName}
                    </p>
                  </div>
                  <span className="ml-auto text-5xl font-black text-white">
                    {selectedGame.awayTeam.score}
                  </span>
                </div>

                {/* VS */}
                <div className="text-center px-8">
                  <span className="text-2xl font-bold text-gray-600">VS</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-bold text-pink-400">
                      {selectedGame.gameStatusText}
                    </span>
                  </div>
                </div>

                {/* Time Mandante */}
                <div className="flex items-center gap-4 flex-1 flex-row-reverse">
                  <img 
                    src={selectedGame.homeTeam.logo} 
                    alt={selectedGame.homeTeam.teamTricode}
                    className="w-20 h-20 object-contain drop-shadow-2xl"
                  />
                  <div className="text-right">
                    <h3 className="text-3xl font-black text-white mb-1">
                      {selectedGame.homeTeam.teamTricode}
                    </h3>
                    <p className="text-gray-400 font-medium">
                      {selectedGame.homeTeam.teamName}
                    </p>
                  </div>
                  <span className="mr-auto text-5xl font-black text-white">
                    {selectedGame.homeTeam.score}
                  </span>
                </div>
              </div>
            </div>

            {/* Body - Estatísticas */}
            <div className="p-8">
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
                    <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
                  </div>
                  <span className="ml-4 text-gray-300">Carregando estatísticas...</span>
                </div>
              ) : gameStats ? (
                <div className="space-y-6">
                  {/* Top Performers */}
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-pink-400" />
                      Top Performers
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Pontos */}
                      <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-5 h-5 text-pink-400" />
                          <h5 className="font-bold text-white">Pontos</h5>
                        </div>
                        
                        {gameStats.awayTeam.leaders.points && (
                          <div className="mb-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.awayTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.awayTeam.leaders.points.displayName}</p>
                            <p className="text-2xl font-black text-pink-400">{gameStats.awayTeam.leaders.points.value} pts</p>
                          </div>
                        )}
                        
                        {gameStats.homeTeam.leaders.points && (
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.homeTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.homeTeam.leaders.points.displayName}</p>
                            <p className="text-2xl font-black text-pink-400">{gameStats.homeTeam.leaders.points.value} pts</p>
                          </div>
                        )}
                      </div>

                      {/* Rebotes */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <h5 className="font-bold text-white">Rebotes</h5>
                        </div>
                        
                        {gameStats.awayTeam.leaders.rebounds && (
                          <div className="mb-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.awayTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.awayTeam.leaders.rebounds.displayName}</p>
                            <p className="text-2xl font-black text-blue-400">{gameStats.awayTeam.leaders.rebounds.value} reb</p>
                          </div>
                        )}
                        
                        {gameStats.homeTeam.leaders.rebounds && (
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.homeTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.homeTeam.leaders.rebounds.displayName}</p>
                            <p className="text-2xl font-black text-blue-400">{gameStats.homeTeam.leaders.rebounds.value} reb</p>
                          </div>
                        )}
                      </div>

                      {/* Assistências */}
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-5 h-5 text-green-400" />
                          <h5 className="font-bold text-white">Assistências</h5>
                        </div>
                        
                        {gameStats.awayTeam.leaders.assists && (
                          <div className="mb-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.awayTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.awayTeam.leaders.assists.displayName}</p>
                            <p className="text-2xl font-black text-green-400">{gameStats.awayTeam.leaders.assists.value} ast</p>
                          </div>
                        )}
                        
                        {gameStats.homeTeam.leaders.assists && (
                          <div className="p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400">{gameStats.homeTeam.abbreviation}</p>
                            <p className="font-bold text-white">{gameStats.homeTeam.leaders.assists.displayName}</p>
                            <p className="text-2xl font-black text-green-400">{gameStats.homeTeam.leaders.assists.value} ast</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 text-center">
                  <TrendingUp className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">
                    Estatísticas em Breve
                  </h4>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    As estatísticas detalhadas estarão disponíveis assim que o jogo começar!
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-pink-400 font-medium">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    Aguardando início do jogo
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}