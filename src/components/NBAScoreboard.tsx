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
    
    // Atualizar a cada 60 segundos
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
      
      console.log('📊 Resposta recebida:', data);
      
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
            logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`
          },
          awayTeam: {
            name: game.awayTeam.teamName,
            tricode: game.awayTeam.teamTricode,
            score: game.awayTeam.score || 0,
            logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`
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
    <div className="bg-black border-b border-gray-800 py-3 sticky top-20 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-2">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-sm px-6 py-3 rounded-lg min-w-max hover:bg-gray-800 transition-all duration-300 border border-gray-800 hover:border-gray-700"
            >
              {/* Away Team */}
              <div className="flex items-center gap-3">
                <img 
                  src={game.awayTeam.logo} 
                  alt={game.awayTeam.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="text-right">
                  <p className="text-white font-bold text-sm tracking-wider">{game.awayTeam.tricode}</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                    {game.awayTeam.score}
                  </p>
                </div>
              </div>
              
              {/* Separator */}
              <div className="text-gray-600 font-bold text-sm px-2">@</div>
              
              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="text-white font-bold text-sm tracking-wider">{game.homeTeam.tricode}</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">
                    {game.homeTeam.score}
                  </p>
                </div>
                <img 
                  src={game.homeTeam.logo} 
                  alt={game.homeTeam.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              
              {/* Status */}
              <div className="ml-4 text-center min-w-[110px]">
                {game.status === 'live' && (
                  <div className="space-y-1">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs rounded-full animate-pulse font-bold flex items-center gap-1.5 justify-center shadow-lg shadow-red-500/50">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      AO VIVO
                    </span>
                    <p className="text-gray-400 text-xs font-mono">
                      {game.period}Q • {game.gameClock.replace('PT', '').replace('S', '').substring(0, 5)}
                    </p>
                  </div>
                )}
                {game.status === 'final' && (
                  <span className="px-4 py-1.5 bg-gray-700/80 text-gray-300 text-xs rounded-full font-bold">
                    FINAL
                  </span>
                )}
                {game.status === 'scheduled' && (
                  <span className="px-3 py-1.5 bg-gray-800/80 text-gray-400 text-xs rounded-full font-medium">
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