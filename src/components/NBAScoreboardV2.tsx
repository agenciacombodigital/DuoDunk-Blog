import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Tv } from 'lucide-react';
import GameStatsModalV2 from './GameStatsModalV2';
import { buscarJogosHoje, Jogo } from '../services/espnApi'; // Importando a função de busca da ESPN

interface Game extends Jogo {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameTimeBrasilia: string;
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

// Função para buscar dados do placar (mesclando ESPN e NBA Boxscore)
const fetchGames = async () => {
  const espnGames = await buscarJogosHoje();
  
  const processedGames: Game[] = [];

  for (const g of espnGames) {
    let gameStatus = 1; // Agendado
    let gameStatusText = g.horario;
    let homeScore = String(g.timeCasa.placar || 0);
    let awayScore = String(g.timeVisitante.placar || 0);
    let gameClock = '';
    let period = 0;
    let homeRecord = '0-0';
    let awayRecord = '0-0';
    
    // Se o jogo estiver ao vivo ou finalizado, buscamos o boxscore da NBA para dados mais ricos
    if (g.status !== 'agendado') {
      try {
        const { data, error } = await supabase.functions.invoke('nba-game-stats-v3', {
          body: { gameId: g.id }
        });
        
        if (error) throw error;
        
        if (data?.success && data?.stats) {
          const stats = data.stats;
          gameStatus = stats.gameState === 'in' ? 2 : 3;
          gameStatusText = stats.status;
          homeScore = stats.homeTeam.score;
          awayScore = stats.awayTeam.score;
          gameClock = stats.gameClock;
          period = stats.period;
          homeRecord = stats.homeTeam.record;
          awayRecord = stats.awayTeam.record;
        }
      } catch (e) {
        console.warn(`Falha ao buscar stats em tempo real para ${g.id}:`, e);
        // Fallback para dados da ESPN
        gameStatus = g.status === 'aovivo' ? 2 : 3;
        gameStatusText = g.status === 'aovivo' ? 'Ao Vivo' : 'Final';
      }
    }

    processedGames.push({
      gameId: g.id,
      gameStatus,
      gameStatusText,
      gameTimeBrasilia: g.horario,
      gameClock,
      period,
      canal: g.canal, // O canal vem da API da ESPN
      homeTeam: {
        teamName: g.timeCasa.nome,
        teamTricode: g.timeCasa.sigla,
        score: homeScore,
        wins: parseInt(homeRecord.split('-')[0] || '0'),
        losses: parseInt(homeRecord.split('-')[1] || '0'),
        logo: g.timeCasa.logo,
      },
      awayTeam: {
        teamName: g.timeVisitante.nome,
        teamTricode: g.timeVisitante.sigla,
        score: awayScore,
        wins: parseInt(awayRecord.split('-')[0] || '0'),
        losses: parseInt(awayRecord.split('-')[1] || '0'),
        logo: g.timeVisitante.logo,
      },
    });
  }
  
  // Filtra jogos que já terminaram há muito tempo (opcional, mas bom para limpar)
  return processedGames.filter(g => g.gameStatus !== 3 || g.gameStatusText.toLowerCase().includes('final'));
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
      const processed = await fetchGames();
      setGames(processed);
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
                {/* Badge AO VIVO - Centralizado e acima do placar */}
                {game.gameStatus === 2 && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 z-10 font-inter">
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

                {/* Status/Horário/Transmissão - Formato brasileiro */}
                <div className="border-t border-gray-700 mt-3 pt-2 flex flex-col gap-1 text-xs font-inter">
                  <div className="flex items-center justify-between">
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
                  
                  {/* Transmissão */}
                  {game.canal && game.gameStatus === 1 && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Tv className="w-3 h-3 text-pink-400" />
                      <span className="text-[10px] font-medium truncate">{game.canal}</span>
                    </div>
                  )}
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