"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Tv, Loader2 } from 'lucide-react';
import GameStatsModalV3 from './GameStatsModalV3'; // ✅ Importando a versão V3 (Design Novo)
import { cn } from '@/lib/utils';

interface Game {
  gameId: string;
  gameStatus: number;
  gameStatusText: string;
  gameTimeBrasilia: string;
  gameClock: string;
  period: number;
  broadcastChannel?: string;
  homeTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    wins: number;
    losses: number;
    logo: string;
    teamId: string; // Importante para a API de stats
  };
  awayTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    wins: number;
    losses: number;
    logo: string;
    teamId: string; // Importante para a API de stats
  };
}

// Helpers de formatação
const formatBroadcast = (game: Game) => {
  const channel = game.broadcastChannel?.toLowerCase() || '';
  if (channel.includes('espn')) return 'ESPN';
  if (channel.includes('amazon') || channel.includes('prime')) return 'Prime Video';
  if (channel.includes('tnt')) return 'TNT';
  if (channel) return channel;
  return 'League Pass';
};

const getGameStatusDisplay = (game: Game) => {
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
    // A Edge Function nba-game-stats-v3 já formata o gameStatusText para o status do quarto/relógio
    return game.gameStatusText; 
  }
  
  return game.gameStatusText;
};

// Helper para obter a URL do logo com fallback
const getLogoUrl = (initialUrl: string, triCode: string): string => {
    if (initialUrl && !initialUrl.includes('undefined')) {
        return initialUrl;
    }
    // Fallback para a URL da ESPN usando o triCode (ex: SA, UTA)
    const abbr = triCode.toLowerCase();
    // Tratamento de exceções comuns na URL da ESPN
    const espnAbbr = abbr === 'uta' ? 'utah' : abbr === 'nop' ? 'no' : abbr;
    return `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`;
};


export default function NBAScoreboardV2() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gamesPerView, setGamesPerView] = useState(3);

  // Responsividade
  useEffect(() => {
    const updateView = () => setGamesPerView(window.innerWidth < 768 ? 1 : 3);
    window.addEventListener('resize', updateView);
    updateView();
    return () => window.removeEventListener('resize', updateView);
  }, []);

  // Busca de Jogos
  const loadGames = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-scoreboard-v2');
      if (error) throw error;
      
      if (data?.success && data?.scoreboard?.games) {
        // Processamento dos dados (mantendo sua lógica Turbo/Híbrida)
        const processed = data.scoreboard.games.map((g: any): Game => ({
          gameId: g.gameId,
          gameStatus: g.gameStatus,
          gameStatusText: g.gameStatusText,
          gameTimeBrasilia: new Date(g.gameTimeUTC).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', timeZone: 'America/Sao_Paulo' }),
          gameClock: g.gameClock,
          period: g.period,
          broadcastChannel: g.broadcastChannel,
          homeTeam: { 
            teamName: g.homeTeam.teamName,
            teamTricode: g.homeTeam.teamTricode,
            score: String(g.homeTeam.score),
            wins: g.homeTeam.wins || 0,
            losses: g.homeTeam.losses || 0,
            logo: getLogoUrl(g.homeTeam.logo, g.homeTeam.teamTricode),
            teamId: g.homeTeam.teamId,
          },
          awayTeam: { 
            teamName: g.awayTeam.teamName,
            teamTricode: g.awayTeam.teamTricode,
            score: String(g.awayTeam.score),
            wins: g.awayTeam.wins || 0,
            losses: g.awayTeam.losses || 0,
            logo: getLogoUrl(g.awayTeam.logo, g.awayTeam.teamTricode),
            teamId: g.awayTeam.teamId,
          },
        }));
        setGames(processed);
      }
    } catch (err) {
      console.error('[Scoreboard] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="bg-black py-4 text-center text-gray-500 text-xs uppercase tracking-widest animate-pulse">Carregando...</div>;
  if (games.length === 0) return <div className="bg-black py-4 text-center text-gray-500 text-xs uppercase tracking-widest">Nenhum jogo hoje</div>;

  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      <div className="bg-black py-4 border-b border-white/10">
        <div className="container mx-auto px-4 flex items-center gap-4">
          {games.length > gamesPerView && (
            <button 
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-30"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {visibleGames.map((game) => {
              const isLive = game.gameStatus === 2;
              const isFinal = game.gameStatus === 3;
              const isScheduled = game.gameStatus === 1;
              const broadcast = formatBroadcast(game);
              
              // Determinar o time vencedor para cores
              const homeScore = parseInt(game.homeTeam.score);
              const awayScore = parseInt(game.awayTeam.score);
              const homeWon = isFinal && homeScore > awayScore;
              const awayWon = isFinal && awayScore > homeScore;

              return (
                <button
                  key={game.gameId}
                  onClick={() => {
                    setSelectedGame(game);
                    setIsModalOpen(true);
                  }}
                  className="group relative bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-4 border border-white/5 hover:border-pink-600/50 transition-all duration-300 flex flex-col"
                >
                  {/* Conteúdo Principal (Placar e Times) */}
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    
                    {/* Header do Card (Transmissão e Status) */}
                    <div className="flex justify-between items-center w-full mb-3">
                       <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-gray-400 text-[10px] font-bold uppercase">
                          <Tv size={10} /> {broadcast}
                       </span>
                       {isLive && (
                          <span className="bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">
                             AO VIVO
                          </span>
                       )}
                       {isScheduled && (
                          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                             {game.gameTimeBrasilia}
                          </span>
                       )}
                    </div>

                    {/* Time Visitante */}
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <img src={game.awayTeam.logo} alt={game.awayTeam.teamTricode} className="w-8 h-8 object-contain" />
                          <div className="text-left">
                             <span className={cn("block font-oswald text-xl leading-none", awayWon ? "text-white" : isFinal ? "text-gray-500" : "text-white")}>{game.awayTeam.teamTricode}</span>
                             <span className="block font-inter text-[10px] text-gray-500">{game.awayTeam.wins}-{game.awayTeam.losses}</span>
                          </div>
                       </div>
                       <span className={cn("font-bebas text-4xl", awayWon ? "text-white" : isFinal ? "text-gray-500" : "text-white")}>
                          {game.awayTeam.score}
                       </span>
                    </div>
                    
                    {/* Time da Casa */}
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <img src={game.homeTeam.logo} alt={game.homeTeam.teamTricode} className="w-8 h-8 object-contain" />
                          <div className="text-left">
                             <span className={cn("block font-oswald text-xl leading-none", homeWon ? "text-white" : isFinal ? "text-gray-500" : "text-white")}>{game.homeTeam.teamTricode}</span>
                             <span className="block font-inter text-[10px] text-gray-500">{game.homeTeam.wins}-{game.homeTeam.losses}</span>
                          </div>
                       </div>
                       <span className={cn("font-bebas text-4xl", homeWon ? "text-white" : isFinal ? "text-gray-500" : "text-white")}>
                          {game.homeTeam.score}
                       </span>
                    </div>
                  </div>

                  {/* Footer do Card (Status do Jogo e Botão) */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className={cn("text-xs font-bold font-oswald uppercase", isLive ? "text-red-500" : "text-gray-400")}>
                       {isLive ? game.gameStatusText : isFinal ? 'FINAL' : game.gameTimeBrasilia}
                    </span>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-pink-500 transition-colors flex items-center gap-1">
                       Estatísticas <ChevronRight size={12} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {games.length > gamesPerView && (
            <button 
              onClick={() => setCurrentIndex(Math.min(games.length - gamesPerView, currentIndex + 1))}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-30"
              disabled={currentIndex >= games.length - gamesPerView}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* ✅ MODAL V3 (Design Novo) */}
      {isModalOpen && selectedGame && (
        <GameStatsModalV3 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          gameId={selectedGame?.gameId || ''}
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