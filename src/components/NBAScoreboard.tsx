import { useEffect, useState } from 'react';

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'live' | 'scheduled';
  time: string;
}

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      // Usando API pública da NBA (sem autenticação)
      const response = await fetch(
        `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`
      );
      
      const data = await response.json();
      
      const formattedGames = data.scoreboard.games.map((game: any) => {
        const isLive = ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'Half'].some(q => game.gameStatusText.includes(q));
        return {
          id: game.gameId,
          homeTeam: game.homeTeam.teamTricode,
          awayTeam: game.awayTeam.teamTricode,
          homeScore: game.homeTeam.score,
          awayScore: game.awayTeam.score,
          status: game.gameStatusText.includes('Final') ? 'final' : isLive ? 'live' : 'scheduled',
          time: game.gameStatusText
        }
      });
      
      setGames(formattedGames);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <p className="text-gray-400 text-center">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-black border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <p className="text-gray-400 text-center">Nenhum jogo hoje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border-b border-gray-800 py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {games.map((game) => (
            <div 
              key={game.id} 
              className="flex items-center gap-4 bg-gray-900 px-6 py-3 rounded-lg min-w-max"
            >
              {/* Away Team */}
              <div className="text-right">
                <p className="text-white font-bold">{game.awayTeam}</p>
                <p className="text-2xl font-bold text-secondary">{game.awayScore || 0}</p>
              </div>
              
              {/* Separator */}
              <div className="text-gray-600 font-bold">VS</div>
              
              {/* Home Team */}
              <div className="text-left">
                <p className="text-white font-bold">{game.homeTeam}</p>
                <p className="text-2xl font-bold text-primary">{game.homeScore || 0}</p>
              </div>
              
              {/* Status */}
              <div className="ml-4">
                {game.status === 'final' && (
                  <span className="px-3 py-1 bg-red-900 text-red-300 text-xs rounded-full">
                    FINAL
                  </span>
                )}
                {game.status === 'live' && (
                  <span className="px-3 py-1 bg-green-900 text-green-300 text-xs rounded-full animate-pulse">
                    AO VIVO
                  </span>
                )}
                {game.status === 'scheduled' && (
                  <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                    {game.time}
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