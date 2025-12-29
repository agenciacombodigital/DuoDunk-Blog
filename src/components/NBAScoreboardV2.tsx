"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Tv, Play } from 'lucide-react';
import GameStatsModalV3 from './GameStatsModalV3';
import { cn } from '@/lib/utils';

// Interfaces e Helpers
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
  if (game.gameStatus === 2) {
    // Extrai o tempo e o período
    let clock = game.gameClock || '';
    const match = clock.match(/PT(\d+)M([\d.]+)S/);
    if (match) clock = `${match[1].padStart(1, '0')}:${Math.floor(parseFloat(match[2])).toString().padStart(2, '0')}`;
    
    // Ajuste solicitado: Se for fim do 2º Quarto, exibe INTERVALO
    if (game.period === 2 && (clock === '00:00' || clock === '0:00' || clock === '')) {
      return 'INTERVALO';
    }

    const periodText = game.period > 4 ? 'PRORROGAÇÃO' : `${game.period}º Quarto`;
    
    // Retorna apenas o período e o tempo para o rodapé
    return `${periodText} • ${clock}`;
  }
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

  // Lógica de Resize e Fetch
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
                const isLive = game.gameStatus === 2;
                const homeScore = parseInt(game.homeTeam.score);
                const awayScore = parseInt(game.awayTeam.score);
                const homeWon = isFinal && homeScore > awayScore;
                const awayWon = isFinal && awayScore > homeScore;
                
                const gameStatusDisplay = getGameStatusDisplay(game);
                
                // Determina a cor da borda
                const borderColor = isLive ? 'border-red-600' : isFinal ? 'border-cyan-600' : 'border-pink-600';
                
                return (
                  <div 
                    key={game.gameId}
                    onClick={() => { setSelectedGame(game); setIsModalOpen(true); }}
                    className={cn(
                      "relative group bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between",
                      `hover:${borderColor}/40`,
                    )}
                    style={{ minHeight: '180px' }}
                  >
                     {/* Topo: Transmissão e Status AO VIVO */}
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-4">
                        <span className="flex items-center gap-1 text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                          <Tv size={10} /> {formatBroadcast(game.broadcastChannel)}
                        </span>
                        {isLive && (
                          <span className="bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            AO VIVO
                          </span>
                        )}
                     </div>

                     {/* Times e Placar */}
                     <div className="flex flex-col gap-3 flex-1">
                        {/* Time Visitante */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={game.awayTeam.logo} alt={game.awayTeam.teamTricode} className="w-10 h-10 object-contain" />
                            <div>
                               {/* Sigla do Time - Oswald */}
                               <span className={cn("block font-oswald text-2xl font-bold leading-none tracking-wide", awayWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.awayTeam.teamTricode}</span>
                               <span className="block font-inter text-[10px] text-zinc-500 font-medium">({game.awayTeam.wins}-{game.awayTeam.losses})</span>
                            </div>
                          </div>
                          {/* Placar - Bebas Neue */}
                          <span className={cn("font-bebas text-4xl text-white tabular-nums tracking-tight", awayWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>
                            {game.awayTeam.score}
                          </span>
                        </div>
                        
                        {/* Time Casa */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={game.homeTeam.logo} alt={game.homeTeam.teamTricode} className="w-10 h-10 object-contain" />
                            <div>
                               {/* Sigla do Time - Oswald */}
                               <span className={cn("block font-oswald text-2xl font-bold leading-none tracking-wide", homeWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>{game.homeTeam.teamTricode}</span>
                               <span className="block font-inter text-[10px] text-zinc-500 font-medium">({game.homeTeam.wins}-{game.homeTeam.losses})</span>
                            </div>
                          </div>
                          {/* Placar - Bebas Neue */}
                          <span className={cn("font-bebas text-4xl text-white tabular-nums tracking-tight", homeWon ? "text-white" : isFinal ? "text-zinc-500" : "text-white")}>
                            {game.homeTeam.score}
                          </span>
                        </div>
                     </div>
                     
                     {/* Rodapé: Status e Detalhes */}
                     <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-4">
                        <span className={cn("text-xs font-bold font-oswald uppercase", isLive ? "text-red-500 animate-pulse" : "text-zinc-500")}>
                          {gameStatusDisplay}
                        </span>
                        <span className="text-xs font-bold text-pink-600 group-hover:text-pink-400 flex items-center gap-1">
                           Estatísticas <ChevronRight size={12} />
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