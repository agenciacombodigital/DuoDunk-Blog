"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Tv, Loader2 } from 'lucide-react';
import GameStatsModalV3 from './GameStatsModalV3';
import { cn } from '@/lib/utils'; // Importando cn para classes condicionais

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

/**
 * Determina o texto de status a ser exibido no placar.
 */
const getGameStatusDisplay = (game: Game): string => {
  // Status 3: Finalizado
  if (game.gameStatus === 3) {
    return game.gameStatusText; // Ex: "Final"
  }
  
  // Status 1: Agendado
  if (game.gameStatus === 1) {
    return game.gameTimeBrasilia;
  }

  // Status 2: Em Andamento (Ao Vivo)
  if (game.gameStatus === 2) {
    const clock = formatGameClock(game.gameClock);
    
    // Verifica se é intervalo (Half Time)
    // A API da NBA geralmente indica intervalo principal (após o 2º quarto)
    // com gameClock vazio ou "PT00M00.00S" e period = 2.
    // Vamos verificar se o relógio está zerado e o período é 2 ou 4 (fim do jogo/prorrogação)
    if (clock === '00:00' && game.period === 2) {
      return 'Intervalo';
    }
    
    // Verifica se é intervalo entre quartos (após 1º e 3º)
    if (clock === '00:00' && (game.period === 1 || game.period === 3)) {
      return `Fim do ${game.period}º Quarto`;
    }
    
    // Se o relógio estiver rodando
    return `${game.period}º Quarto • ${clock}`;
  }

  return game.gameStatusText;
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

  if (loading) {
    return (
      <div className="bg-[#09090b] py-3 border-b border-white/10 text-center flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
        <span className="text-gray-400 text-sm font-medium font-inter">
          Carregando jogos...
        </span>
      </div>
    );
  }
  
  if (games.length === 0) {
    return (
      <div className="bg-[#09090b] py-3 border-b border-white/10 text-center">
        <span className="text-gray-400 text-sm font-medium font-inter">
          Nenhum jogo hoje
        </span>
      </div>
    );
  }

  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      {/* Fundo da barra alterado para o preto premium */}
      <div className="bg-[#09090b] py-3 border-b border-white/10">
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
                // Estilo do card de jogo ajustado para o design premium
                className="group relative bg-zinc-900/40 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 hover:border-pink-500/50 transition-all hover:scale-[1.02] shadow-xl hover:shadow-pink-500/20"
              >
                {/* Transmissão */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10">
                  <span className="bg-zinc-800 text-zinc-400 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 font-inter whitespace-nowrap">
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
                        {/* Fonte Oswald para Tricode */}
                        <span className="font-oswald text-base md:text-lg font-bold uppercase text-white block truncate">{game.awayTeam.teamTricode}</span>
                        <span className="font-inter text-xs text-zinc-400 block truncate">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                      </div>
                    </div>
                    {/* Fonte Bebas para Placar */}
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
                        {/* Fonte Oswald para Tricode */}
                        <span className="font-oswald text-base md:text-lg font-bold uppercase text-white block truncate">{game.homeTeam.teamTricode}</span>
                        <span className="font-inter text-xs text-zinc-400 block truncate">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                      </div>
                    </div>
                    {/* Fonte Bebas para Placar */}
                    <span className="font-bebas text-3xl md:text-4xl text-white tabular-nums flex-shrink-0 ml-2">{game.homeTeam.score}</span>
                  </div>
                </div>

                {/* Status/Horário - Formato brasileiro */}
                <div className="border-t border-white/10 mt-3 pt-2 flex items-center justify-between text-xs font-inter">
                  <span className={cn("font-bold", game.gameStatus === 2 ? 'text-red-400' : 'text-cyan-400')}>
                    {getGameStatusDisplay(game)}
                  </span>
                  <span className="text-zinc-400 group-hover:text-pink-400 transition-colors flex items-center gap-1 text-[10px] md:text-xs">
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
        <GameStatsModalV3
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.gameId}
          homeTeam={{
            name: selectedGame.homeTeam.teamName,
            triCode: selectedGame.homeTeam.teamTricode,
            logo: selectedGame.homeTeam.logo,
            record: `${selectedGame.homeTeam.wins}-${selectedGame.homeTeam.losses}`,
          }}
          awayTeam={{
            name: selectedGame.awayTeam.teamName,
            triCode: selectedGame.awayTeam.teamTricode,
            logo: selectedGame.awayTeam.logo,
            record: `${selectedGame.awayTeam.wins}-${selectedGame.awayTeam.losses}`,
          }}
        />
      )}
    </>
  );
}