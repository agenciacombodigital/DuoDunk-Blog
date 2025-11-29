"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Tv, Play } from 'lucide-react';
import GameStatsModalV3 from './GameStatsModalV3';
import { cn } from '@/lib/utils';

// Interfaces e Helpers (Resumidos para brevidade, use a lógica Turbo existente)
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
    teamId: string;
  };
  awayTeam: {
    teamName: string;
    teamTricode: string;
    score: string;
    wins: number;
    losses: number;
    logo: string;
    teamId: string;
  };
}

const getGameStatusDisplay = (game: any) => {
  if (game.gameStatus === 3) return 'FINAL';
  if (game.gameStatus === 1) return game.gameTimeBrasilia; // Ex: 19:00
  if (game.gameStatus === 2) return `AO VIVO • ${game.gameStatusText}`; // Ex: AO VIVO • 4º Q 2:00
  return '';
};

const formatBroadcast = (channel?: string) => {
  const c = (channel || '').toLowerCase();
  if (c.includes('espn')) return 'ESPN';
  if (c.includes('prime') || c.includes('amazon')) return 'Prime Video';
  return 'League Pass';
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

  // Lógica de Resize e Fetch (Igual ao anterior)
  useEffect(() => {
    const handleResize = () => setGamesPerView(window.innerWidth < 768 ? 1 : 3);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadGames = async () => {
     try {
       const { data } = await supabase.functions.invoke('nba-scoreboard-v2');
       if (data?.success && data?.scoreboard?.games) {
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
     } catch (e) { console.error(e); } 
     finally { setLoading(false); }
  };

  useEffect(() => { 
    loadGames(); 
    const interval = setInterval(loadGames, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Renderização
  if (loading) return <div className="bg-black h-16 border-b border-white/10 animate-pulse" />;
  if (games.length === 0) return <div className="bg-black py-3 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-white/10">Nenhum jogo hoje</div>;

  const visibleGames = games.slice(currentIndex, currentIndex + gamesPerView);

  return (
    <>
      <div className="bg-black border-b border-white/10 py-4 select-none">
        <div className="container mx-auto px-4 flex items-center gap-4">
           {/* Botão Esq */}
           <button 
             onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
             disabled={currentIndex === 0}
             className="text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
           >
             <ChevronLeft size={24} />
           </button>

           {/* Grid de Jogos */}
           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleGames.map(game => {
                const isFinal = game.gameStatus === 3;
                const homeScore = parseInt(game.homeTeam.score);
                const awayScore = parseInt(game.awayTeam.score);
                const homeWon = isFinal && homeScore > awayScore;
                const awayWon = isFinal && awayScore > homeScore;
                
                return (
                  <div 
                    key={game.gameId}
                    onClick={() => { setSelectedGame(game); setIsModalOpen(true); }}
                    className="relative group bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-pink-600/40 rounded-xl p-4 transition-all cursor-pointer"
                  >
                     {/* Status Topo */}
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-3">
                        <span className={cn(game.gameStatus === 2 ? "text-red-500 animate-pulse" : "text-cyan-400")}>
                          {getGameStatusDisplay(game)}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                          <Tv size={10} /> {formatBroadcast(game.broadcastChannel)}
                        </span>
                     </div>

                     {/* Times e Placar */}
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={game.awayTeam.logo} alt={game.awayTeam.teamTricode} className="w-8 h-8 object-contain" />
                          <div>
                             <span className={cn("block font-oswald text-xl leading-none", awayWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.awayTeam.teamTricode}</span>
                             <span className="block font-inter text-[10px] text-zinc-500">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                          </div>
                        </div>
                        
                        <div className="font-bebas text-3xl text-white tabular-nums flex gap-1">
                           <span className={cn(awayWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.awayTeam.score}</span>
                           <span className="text-zinc-700">:</span>
                           <span className={cn(homeWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.homeTeam.score}</span>
                        </div>

                        <div className="flex items-center gap-3 flex-row-reverse text-right">
                          <img src={game.homeTeam.logo} alt={game.homeTeam.teamTricode} className="w-8 h-8 object-contain" />
                          <div>
                             <span className={cn("block font-oswald text-xl leading-none", homeWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.homeTeam.teamTricode}</span>
                             <span className="block font-inter text-[10px] text-zinc-500">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                          </div>
                        </div>
                     </div>
                     
                     {/* Hover Action */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                           <Play size={10} fill="currentColor" /> Ver Detalhes
                        </span>
                     </div>
                  </div>
                );
              })}
           </div>

           {/* Botão Dir */}
           <button 
             onClick={() => setCurrentIndex(Math.min(games.length - gamesPerView, currentIndex + 1))}
             disabled={currentIndex >= games.length - gamesPerView}
             className="text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      </div>

      {/* Modal Conectado */}
      {isModalOpen && selectedGame && (
        <GameStatsModalV3 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
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