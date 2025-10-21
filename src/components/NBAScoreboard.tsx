import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Game {
  gameId: string;
  gameStatus: string;
  gameStatusText: string;
  homeTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    logo?: string;
  };
  awayTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    logo?: string;
  };
}

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadGames();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-scoreboard');
      
      if (error) {
        console.error('Erro ao buscar jogos:', error);
        setGames([]);
      } else if (data?.scoreboard?.games && data.scoreboard.games.length > 0) {
        const formattedGames = data.scoreboard.games.map((game: any) => ({
          ...game,
          homeTeam: {
            ...game.homeTeam,
            logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`
          },
          awayTeam: {
            ...game.awayTeam,
            logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`
          }
        }));
        console.log('✅ Jogos carregados:', formattedGames.length);
        setGames(formattedGames);
      } else {
        console.log('ℹ️ Nenhum jogo disponível');
        setGames([]);
      }
    } catch (err) {
      console.error('Erro na requisição:', err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const nextGames = () => {
    setCurrentIndex((prev) => (prev + 3 >= games.length ? 0 : prev + 3));
  };

  const prevGames = () => {
    setCurrentIndex((prev) => (prev - 3 < 0 ? Math.max(0, games.length - 3) : prev - 3));
  };

  if (loading) {
    return (
      <div className="bg-gray-900 py-4 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500" />
            <span>Carregando placar...</span>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-gray-900 py-3 border-b border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <span className="text-gray-400 text-sm">Nenhum jogo da NBA hoje 🏀</span>
        </div>
      </div>
    );
  }

  const visibleGames = games.slice(currentIndex, currentIndex + 3);

  return (
    <div className="bg-gray-900 py-4 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* Botão Anterior */}
          {games.length > 3 && (
            <button
              onClick={prevGames}
              className="p-2 hover:bg-gray-800 rounded-full transition flex-shrink-0"
              aria-label="Jogos anteriores"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* Lista de Jogos */}
          <div className="flex-1 flex gap-4 justify-center overflow-hidden">
            {visibleGames.map((game) => (
              <div
                key={game.gameId}
                className="bg-gray-800 rounded-lg px-6 py-3 flex items-center gap-4 min-w-[280px] hover:bg-gray-700 transition"
              >
                {/* Time Visitante */}
                <div className="flex items-center gap-2 flex-1">
                  {game.awayTeam.logo && (
                    <img 
                      src={game.awayTeam.logo} 
                      alt={game.awayTeam.teamTricode}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="font-bold text-white text-lg">
                    {game.awayTeam.teamTricode}
                  </span>
                  <span className="text-2xl font-bold text-white ml-auto">
                    {game.awayTeam.score}
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col items-center px-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {game.gameStatusText}
                  </span>
                  {game.gameStatus === '2' && ( // '2' significa "in progress"
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1" />
                  )}
                </div>

                {/* Time Mandante */}
                <div className="flex items-center gap-2 flex-1 flex-row-reverse">
                  {game.homeTeam.logo && (
                    <img 
                      src={game.homeTeam.logo} 
                      alt={game.homeTeam.teamTricode}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="font-bold text-white text-lg">
                    {game.homeTeam.teamTricode}
                  </span>
                  <span className="text-2xl font-bold text-white mr-auto">
                    {game.homeTeam.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Próximo */}
          {games.length > 3 && (
            <button
              onClick={nextGames}
              className="p-2 hover:bg-gray-800 rounded-full transition flex-shrink-0"
              aria-label="Próximos jogos"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}