import { useEffect, useState } from 'react';
import { RefreshCw, X, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GameLeader {
  name: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface Game {
  id: string;
  homeTeam: {
    name: string;
    tricode: string;
    score: number;
    logo: string;
    leaders: GameLeader | null;
  };
  awayTeam: {
    name: string;
    tricode: string;
    score: number;
    logo: string;
    leaders: GameLeader | null;
  };
  status: 'final' | 'live' | 'scheduled';
  statusText: string;
  period: number;
  gameClock: string;
}

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames();
    
    const interval = setInterval(() => {
      setGames(currentGames => {
        const hasLiveGames = currentGames.some(g => g.status === 'live');
        if (hasLiveGames) {
          fetchGames();
        }
        return currentGames;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      console.log('🏀 Buscando placar da NBA...');
      setError(false);
      
      const { data, error: functionError } = await supabase.functions.invoke('nba-scoreboard');
      
      if (functionError) {
        console.error('❌ Erro na Edge Function:', functionError);
        throw new Error(functionError.message);
      }
      
      if (!data?.scoreboard?.games || data.scoreboard.games.length === 0) {
        console.log('ℹ️ Nenhum jogo encontrado');
        setGames([]);
        setLoading(false);
        return;
      }

      const formattedGames: Game[] = data.scoreboard.games.map((game: any) => {
        const isLive = game.gameStatus === 2;
        const isFinal = game.gameStatus === 3;

        return {
          id: game.gameId,
          homeTeam: {
            name: game.homeTeam.teamName,
            tricode: game.homeTeam.teamTricode,
            score: game.homeTeam.score || 0,
            logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
            leaders: game.gameLeaders?.homeLeaders?.personId ? {
              name: game.gameLeaders.homeLeaders.name,
              points: game.gameLeaders.homeLeaders.points,
              rebounds: game.gameLeaders.homeLeaders.rebounds,
              assists: game.gameLeaders.homeLeaders.assists
            } : null
          },
          awayTeam: {
            name: game.awayTeam.teamName,
            tricode: game.awayTeam.teamTricode,
            score: game.awayTeam.score || 0,
            logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
            leaders: game.gameLeaders?.awayLeaders?.personId ? {
              name: game.gameLeaders.awayLeaders.name,
              points: game.gameLeaders.awayLeaders.points,
              rebounds: game.gameLeaders.awayLeaders.rebounds,
              assists: game.gameLeaders.awayLeaders.assists
            } : null
          },
          status: isLive ? 'live' : isFinal ? 'final' : 'scheduled',
          statusText: game.gameStatusText.trim(),
          period: game.period || 0,
          gameClock: game.gameClock || ''
        };
      });
      
      console.log(`✅ ${formattedGames.length} jogos carregados`);
      setGames(formattedGames);
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar jogos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-gray-400 text-sm">Carregando jogos da NBA...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <p className="text-gray-400 text-sm">Erro ao carregar placar</p>
            <button 
              onClick={fetchGames}
              className="text-cyan-400 hover:text-cyan-300 text-sm underline transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <p className="text-gray-400 text-center text-sm">
            Nenhum jogo da NBA hoje 🏀
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-black border-b border-gray-800 py-3 sticky top-20 z-40">
        <div className="container mx-auto px-4">
          {/* Scroll horizontal com setas visuais */}
          <div className="relative group">
            {/* Gradiente esquerdo */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            
            {/* Gradiente direito */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-sm px-5 py-3 rounded-xl min-w-max hover:bg-gray-800 transition-all duration-300 border border-gray-800 hover:border-cyan-500/50 hover:scale-105 cursor-pointer group/card"
                >
                  {/* Away Team */}
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={game.awayTeam.logo} 
                      alt={game.awayTeam.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-right">
                      <p className="text-white font-bold text-xs tracking-wider">{game.awayTeam.tricode}</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                        {game.awayTeam.score}
                      </p>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="text-gray-600 font-bold text-xs px-1">@</div>
                  
                  {/* Home Team */}
                  <div className="flex items-center gap-2.5">
                    <div className="text-left">
                      <p className="text-white font-bold text-xs tracking-wider">{game.homeTeam.tricode}</p>
                      <p className="text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">
                        {game.homeTeam.score}
                      </p>
                    </div>
                    <img 
                      src={game.homeTeam.logo} 
                      alt={game.homeTeam.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Status */}
                  <div className="ml-3 text-center min-w-[100px]">
                    {game.status === 'live' && (
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] rounded-full animate-pulse font-bold flex items-center gap-1 justify-center shadow-lg shadow-red-500/50">
                          <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                          AO VIVO
                        </span>
                        <p className="text-gray-400 text-[10px] font-mono">
                          {game.period}Q • {game.gameClock.replace('PT', '').replace('S', '').substring(0, 5)}
                        </p>
                      </div>
                    )}
                    {game.status === 'final' && (
                      <span className="px-3 py-1 bg-gray-700/80 text-gray-300 text-[10px] rounded-full font-bold">
                        FINAL
                      </span>
                    )}
                    {game.status === 'scheduled' && (
                      <span className="px-2.5 py-1 bg-gray-800/80 text-gray-400 text-[10px] rounded-full font-medium">
                        {game.statusText}
                      </span>
                    )}
                  </div>
                  
                  {/* Indicador de clique */}
                  <TrendingUp className="w-4 h-4 text-gray-600 group-hover/card:text-cyan-400 transition-colors ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Estatísticas */}
      {selectedGame && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedGame(null)}
        >
          <div 
            className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-gray-800 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setSelectedGame(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Título */}
            <h2 className="text-2xl font-bold text-white mb-6">Estatísticas do Jogo</h2>

            {/* Placar Grande */}
            <div className="flex items-center justify-between mb-8 bg-black/50 rounded-xl p-6">
              {/* Away Team */}
              <div className="flex flex-col items-center flex-1">
                <img 
                  src={selectedGame.awayTeam.logo} 
                  alt={selectedGame.awayTeam.name}
                  className="w-16 h-16 mb-3"
                />
                <p className="text-sm text-gray-400 mb-1">{selectedGame.awayTeam.name}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                  {selectedGame.awayTeam.score}
                </p>
              </div>

              {/* Status */}
              <div className="text-center px-6">
                {selectedGame.status === 'live' && (
                  <span className="px-4 py-2 bg-red-600 text-white text-sm rounded-full animate-pulse font-bold">
                    🔴 AO VIVO
                  </span>
                )}
                {selectedGame.status === 'final' && (
                  <span className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-full font-bold">
                    FINAL
                  </span>
                )}
                <p className="text-gray-400 text-xs mt-2">
                  {selectedGame.period}Q • {selectedGame.statusText}
                </p>
              </div>

              {/* Home Team */}
              <div className="flex flex-col items-center flex-1">
                <img 
                  src={selectedGame.homeTeam.logo} 
                  alt={selectedGame.homeTeam.name}
                  className="w-16 h-16 mb-3"
                />
                <p className="text-sm text-gray-400 mb-1">{selectedGame.homeTeam.name}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">
                  {selectedGame.homeTeam.score}
                </p>
              </div>
            </div>

            {/* Líderes do Jogo */}
            <div className="grid grid-cols-2 gap-4">
              {/* Away Leaders */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-sm font-bold text-cyan-400 mb-3">
                  Destaque {selectedGame.awayTeam.tricode}
                </h3>
                {selectedGame.awayTeam.leaders ? (
                  <div>
                    <p className="text-white font-semibold mb-2">{selectedGame.awayTeam.leaders.name}</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>{selectedGame.awayTeam.leaders.points} PTS</p>
                      <p>{selectedGame.awayTeam.leaders.rebounds} REB</p>
                      <p>{selectedGame.awayTeam.leaders.assists} AST</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Sem estatísticas disponíveis</p>
                )}
              </div>

              {/* Home Leaders */}
              <div className="bg-black/30 rounded-lg p-4">
                <h3 className="text-sm font-bold text-pink-400 mb-3">
                  Destaque {selectedGame.homeTeam.tricode}
                </h3>
                {selectedGame.homeTeam.leaders ? (
                  <div>
                    <p className="text-white font-semibold mb-2">{selectedGame.homeTeam.leaders.name}</p>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p>{selectedGame.homeTeam.leaders.points} PTS</p>
                      <p>{selectedGame.homeTeam.leaders.rebounds} REB</p>
                      <p>{selectedGame.homeTeam.leaders.assists} AST</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Sem estatísticas disponíveis</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}