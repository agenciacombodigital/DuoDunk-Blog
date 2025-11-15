import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Tv } from 'lucide-react';
import GameStatsModalV2 from './GameStatsModalV2';

interface Game {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameTimeBrasilia: string;
  gameClock: string;
  period: number;
  broadcastChannel?: string; // Novo campo
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

// Helper para converter tempo da NBA para formato brasileiro
const formatGameClock = (clock: string): string => {
  if (!clock || clock === '') return '';
  
  // Formato NBA: "PT04M20.00S" = 4 minutos e 20 segundos
  const match = clock.match(/PT(\d+)M([\d.]+)S/);
  if (match) {
    const minutes = match[1].padStart(2, '0');
    const seconds = Math.floor(parseFloat(match[2])).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  
  return clock;
};

const convertToBrasiliaTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Sao_Paulo' 
    });
  } catch (e) {
    return 'N/D';
  }
};

// Mapeamento manual de jogos Prime Video/ESPN (Exemplo baseado em jogos de destaque)
// Em um ambiente real, isso seria alimentado por uma API de calendário brasileira.
const PRIME_VIDEO_GAMES: [string, string][] = [
  ['NYK', 'MIA'], // Knicks x Heat
  ['GSW', 'SAS'], // Warriors x Spurs
];

const ESPN_GAMES: [string, string][] = [
  // Adicione jogos ESPN aqui
];

// Helper para verificar se um jogo corresponde a um mapeamento
const isGameMatch = (team1: string, team2: string, list: [string, string][]): boolean => {
  const teams = [team1, team2].sort();
  return list.some(pair => {
    const sortedPair = pair.sort();
    return sortedPair[0] === teams[0] && sortedPair[1] === teams[1];
  });
};

// Helper para formatar o canal de transmissão
const formatBroadcast = (game: Game): string => {
  let channels = ['League Pass'];
  const home = game.homeTeam.teamTricode;
  const away = game.awayTeam.teamTricode;
  const apiChannel = game.broadcastChannel?.toLowerCase();
  
  // 1. Mapeamento manual (Prime Video/ESPN Brasil)
  if (isGameMatch(home, away, PRIME_VIDEO_GAMES)) {
    channels.unshift('Prime Video');
  }
  
  if (isGameMatch(home, away, ESPN_GAMES)) {
    channels.unshift('ESPN');
  }

  // 2. Mapeamento de canais nacionais dos EUA (se não for Prime Video/ESPN)
  if (apiChannel) {
    if (apiChannel.includes('espn') && !channels.includes('ESPN')) {
      channels.unshift('ESPN');
    }
    if (apiChannel.includes('tnt') && !channels.includes('TNT')) {
      channels.unshift('TNT');
    }
    // Adicione outros canais nacionais aqui se necessário
  }
  
  // Remove duplicatas e junta
  const uniqueChannels = Array.from(new Set(channels));
  
  // Se tiver mais de um, junta com " / "
  return uniqueChannels.join(' / ');
};

export default function NBAScoreboardV2() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gamesPerView, setGamesPerView] = useState(3);

  useEffect(() => {
    const updateGamesPerView = () => {
      setGamesPerView(window.innerWidth < 768 ? 1 : 3);
    };

    window.addEventListener('resize', updateGamesPerView);
    updateGamesPerView(); // Call on initial mount

    return () => window.removeEventListener('resize', updateGamesPerView);
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-scoreboard-v2');
      if (error) throw error;
      
      if (data?.success && data?.scoreboard?.games) {
        const processed = data.scoreboard.games.map((g: any): Game => ({
          gameId: g.gameId,
          gameStatus: g.gameStatus,
          gameStatusText: g.gameStatusText,
          gameTimeBrasilia: convertToBrasiliaTime(g.gameTimeUTC),
          gameClock: g.gameClock,
          period: g.period,
          broadcastChannel: g.broadcastChannel, // Usando o novo campo
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

  useEffect(() => {
    loadGames();
  }, []);

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
        <span className="text-gray-400 text-sm font-medium font-inter">
          {loading ? 'Carregando jogos...' : 'Nenhum jogo hoje'}
        </span>
      </div>
    );
  }

  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      <div className="bg-gray-900 py-3 border-b border-gray-700/50">
        <div className="container mx-auto px-4 flex items-center gap-2 md:gap-4">
          {games.length > gamesPerView && (
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className={`w-5 h-5 md:w-6 md:h-6 ${currentIndex === 0 ? 'text-gray-600' : 'text-gray-400'}`} />
            </button>
          )}

          {/* Grid responsivo: 1 coluna no mobile, 3 no desktop */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {visibleGames.map((game) => (
              <button
                key={game.gameId}
                onClick={() => {
                  setSelectedGame(game);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-3 md:p-4 border border-gray-700/50 hover:border-pink-500/50 transition-all hover:scale-[1.02] shadow-xl hover:shadow-pink-500/20"
              >
                {/* Transmissão - NOVO */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10">
                  <span className="bg-gray-700 text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 font-inter whitespace-nowrap">
                    <Tv className="w-2.5 h-2.5" />
                    {formatBroadcast(game)}
                  </span>
                </div>

                {/* Badge AO VIVO - Centralizado e acima do placar */}
                {game.gameStatus === 2 && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 z-10 font-inter">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    AO VIVO
                  </div>
                )}

                {/* Placar Compacto */}
                <div className="space-y-2 mt-6">
                  {/* Away Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <img 
                        src={game.awayTeam.logo} 
                        alt={game.awayTeam.teamTricode} 
                        className="w-7 h-7 md:w-8 md:h-8 drop-shadow-lg flex-shrink-0" 
                      />
                      <div className="text-left min-w-0">
                        <span className="font-oswald text-base md:text-lg font-bold uppercase text-white block truncate">{game.awayTeam.teamTricode}</span>
                        <span className="font-inter text-xs text-gray-400 block truncate">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                      </div>
                    </div>
                    <span className="font-bebas text-3xl md:text-4xl text-white tabular-nums flex-shrink-0 ml-2">{game.awayTeam.score}</span>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <img 
                        src={game.homeTeam.logo} 
                        alt={game.homeTeam.teamTricode} 
                        className="w-7 h-7 md:w-8 md:h-8 drop-shadow-lg flex-shrink-0" 
                      />
                      <div className="text-left min-w-0">
                        <span className="font-oswald text-base md:text-lg font-bold uppercase text-white block truncate">{game.homeTeam.teamTricode}</span>
                        <span className="font-inter text-xs text-gray-400 block truncate">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                      </div>
                    </div>
                    <span className="font-bebas text-3xl md:text-4xl text-white tabular-nums flex-shrink-0 ml-2">{game.homeTeam.score}</span>
                  </div>
                </div>

                {/* Status/Horário - Formato brasileiro */}
                <div className="border-t border-gray-700 mt-3 pt-2 flex items-center justify-between text-xs font-inter">
                  <span className={`font-bold ${game.gameStatus === 2 ? 'text-red-400' : 'text-cyan-400'}`}>
                    {game.gameStatus === 2 
                      ? `${game.period}º Quarto • ${formatGameClock(game.gameClock)}`
                      : game.gameStatus === 1
                        ? game.gameTimeBrasilia
                        : game.gameStatusText
                    }
                  </span>
                  <span className="text-gray-400 group-hover:text-pink-400 transition-colors flex items-center gap-1 text-[10px] md:text-xs">
                    Estatísticas <Play className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {games.length > gamesPerView && (
            <button
              onClick={() => setCurrentIndex(Math.min(games.length - gamesPerView, currentIndex + 1))}
              className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0"
              disabled={currentIndex >= games.length - gamesPerView}
            >
              <ChevronRight className={`w-5 h-5 md:w-6 md:h-6 ${currentIndex >= games.length - gamesPerView ? 'text-gray-600' : 'text-gray-400'}`} />
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