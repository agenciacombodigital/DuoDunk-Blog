import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Game {
  id: string;
  homeTeam: {
    name: string;
    tricode: string;
    score: number;
    logo: string;
  };
  awayTeam: {
    name: string;
    tricode: string;
    score: number;
    logo: string;
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
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      setError(false);
      
      // Usar nossa Edge Function proxy
      const { data, error: functionError } = await supabase.functions.invoke('nba-scoreboard');
      
      if (functionError) {
        throw new Error(functionError.message);
      }
      
      if (!data?.scoreboard?.games || data.scoreboard.games.length === 0) {
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
            logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`
          },
          awayTeam: {
            name: game.awayTeam.teamName,
            tricode: game.awayTeam.teamTricode,
            score: game.awayTeam.score || 0,
            logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`
          },
          status: isLive ? 'live' : isFinal ? 'final' : 'scheduled',
          statusText: game.gameStatusText,
          period: game.period || 0,
          gameClock: game.gameClock || ''
        };
      });
      
      setGames(formattedGames);
    } catch (err: any) {
      console.error('Erro ao buscar jogos:', err);
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
              className="text-cyan-400 hover:text-cyan-300 text-sm underline"
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
    <div className="bg-black border-b border-gray-800 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-2">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex items-center gap-4 bg-gray-900 px-6 py-3 rounded-lg min-w-max hover:bg-gray-800 transition-colors"
            >
              {/* Away Team */}
              <div className="flex items-center gap-3">
                <img 
                  src={game.awayTeam.logo} 
                  alt={game.awayTeam.name}
                  className="w-8 h-8"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="text-right">
                  <p className="text-white font-bold text-sm">{game.awayTeam.tricode}</p>
                  <p className="text-2xl font-bold text-secondary">{game.awayTeam.score}</p>
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-gray-600 font-bold text-sm">@</div>
              
              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-white font-bold text-sm">{game.homeTeam.tricode}</p>
                  <p className="text-2xl font-bold text-primary">{game.homeTeam.score}</p>
                </div>
                <img 
                  src={game.homeTeam.logo} 
                  alt={game.homeTeam.name}
                  className="w-8 h-8"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              
              {/* Status */}
              <div className="ml-4 text-center w-28">
                {game.status === 'live' && (
                  <div>
                    <span className="px-3 py-1 bg-red-900 text-red-300 text-xs rounded-full animate-pulse font-bold">
                      🔴 AO VIVO
                    </span>
                    <p className="text-gray-400 text-xs mt-1 font-mono">
                      {game.period}Q {game.gameClock}
                    </p>
                  </div>
                )}
                {game.status === 'final' && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-semibold">
                    FINAL
                  </span>
                )}
                {game.status === 'scheduled' && (
                  <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                    {game.statusText}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}