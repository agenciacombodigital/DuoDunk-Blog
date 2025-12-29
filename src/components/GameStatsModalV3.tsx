"use client";

import { useEffect, useState } from 'react';
import { X, Trophy, BarChart2, Clock, MapPin, Users, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Tipos
interface PlayerStats {
  id: number;
  nameI: string;
  jerseyNum: string;
  position: string;
  value?: number;
  stats?: any;
  oncourt?: boolean;
}

interface TeamStats {
  name: string;
  abbreviation: string;
  logo: string;
  score: string;
  record: string;
  performers: {
    points: PlayerStats[];
    rebounds: PlayerStats[];
    assists: PlayerStats[];
    steals: PlayerStats[];
    blocks: PlayerStats[];
  };
  allPlayers: PlayerStats[];
  teamStats?: any;
}

interface GameStats {
  status: string;
  gameState: string;
  gameClock: string;
  period: number;
  arena: string;
  city: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  gameTimeBrasilia: string;
  attendance: string;
}

interface GameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  homeTeam: any;
  awayTeam: any;
}

// Helper de Status PT-BR
const getGameStatusDisplay = (stats: any): string => {
  if (stats.gameState === 'post' || stats.status?.includes('Final')) return 'FINAL';
  if (stats.gameState === 'pre') return stats.gameTimeBrasilia;
  if (stats.gameState === 'in') {
    // Tenta formatar o relógio se vier no formato PT12M...
    let clock = stats.gameClock || '';
    const match = clock.match(/PT(\d+)M([\d.]+)S/);
    if (match) clock = `${match[1].padStart(2, '0')}:${Math.floor(parseFloat(match[2])).toString().padStart(2, '0')}`;
    
    // Ajuste solicitado: Se for fim do 2º Quarto, exibe INTERVALO
    if (stats.period === 2 && (clock === '00:00' || clock === '0:00' || clock === '')) {
      return 'INTERVALO';
    }

    if (stats.period > 4) return `PRORROGAÇÃO • ${clock}`;
    return `${stats.period}º QUARTO • ${clock}`;
  }
  return stats.status;
};

export default function GameStatsModalV3({ isOpen, onClose, gameId, homeTeam, awayTeam }: GameStatsModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'team_stats' | 'boxscore'>('summary');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && gameId) {
      fetchStats();
    }
    return () => setStats(null);
  }, [isOpen, gameId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('nba-game-stats-v3', {
        body: { gameId, homeRecord: homeTeam.record, awayRecord: awayTeam.record }
      });
      if (error) throw error;
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 pt-8 pb-6 px-4 border-b border-white/5 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-10">
            <X size={20} />
          </button>

          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* Visitante */}
            <div className="flex flex-col items-center w-1/3">
              <img src={awayTeam.logo} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <h2 className="text-2xl md:text-4xl font-black text-white font-oswald tracking-wide mt-2">{awayTeam.triCode}</h2>
              <p className="text-zinc-500 text-sm font-medium">{stats?.awayTeam.record || awayTeam.record}</p>
            </div>

            {/* Placar */}
            <div className="flex flex-col items-center justify-center w-1/3">
              {loading ? (
                 <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"/>
              ) : (
                <>
                  <div className="flex items-center gap-4 md:gap-8 text-5xl md:text-7xl font-black text-white font-oswald tabular-nums tracking-tight">
                    <span>{stats?.awayTeam.score || '0'}</span>
                    <span className="text-zinc-700 text-3xl font-light">:</span>
                    <span>{stats?.homeTeam.score || '0'}</span>
                  </div>
                  <div className="mt-2 text-center">
                     <span className={cn("text-xs md:text-sm font-bold font-mono uppercase tracking-wider", stats?.gameState === 'in' ? "text-red-500 animate-pulse" : "text-cyan-400")}>
                        {stats ? getGameStatusDisplay(stats) : 'AGUARDANDO'}
                     </span>
                  </div>
                </>
              )}
            </div>

            {/* Casa */}
            <div className="flex flex-col items-center w-1/3">
              <img src={homeTeam.logo} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              <h2 className="text-2xl md:text-4xl font-black text-white font-oswald tracking-wide mt-2">{homeTeam.triCode}</h2>
              <p className="text-zinc-500 text-sm font-medium">{stats?.homeTeam.record || homeTeam.record}</p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex justify-center gap-2 p-3 bg-zinc-900/50 border-b border-white/5">
          {[
            { id: 'summary', label: 'Destaques', icon: Trophy },
            { id: 'team_stats', label: 'Estatísticas', icon: Activity },
            { id: 'boxscore', label: 'Box Score', icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-900/20" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b] p-4 md:p-6">
          {!loading && stats ? (
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* DESTAQUES */}
              {activeTab === 'summary' && (
                <>
                  {['points', 'rebounds', 'assists'].map((statKey) => {
                     const label = statKey === 'points' ? 'PONTOS' : statKey === 'rebounds' ? 'REBOTES' : 'ASSISTÊNCIAS';
                     const awayL = stats.awayTeam.performers[statKey as keyof typeof stats.awayTeam.performers] || [];
                     const homeL = stats.homeTeam.performers[statKey as keyof typeof stats.homeTeam.performers] || [];
                     const maxVal = Math.max(awayL[0]?.value || 0, homeL[0]?.value || 0, 1);

                     return (
                       <div key={statKey} className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                          <div className="bg-white/5 py-2 text-center border-b border-white/5">
                            <span className="text-xs font-black text-zinc-500 tracking-widest">{label}</span>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-white/5">
                             <div className="p-3 space-y-3">
                                {awayL.slice(0, 5).map((p, i) => <PlayerRow key={i} player={p} rank={i+1} maxVal={maxVal} />)}
                             </div>
                             <div className="p-3 space-y-3">
                                {homeL.slice(0, 5).map((p, i) => <PlayerRow key={i} player={p} rank={i+1} maxVal={maxVal} alignRight />)}
                             </div>
                          </div>
                       </div>
                     )
                  })}
                  <div className="text-center text-zinc-500 text-xs pt-4 border-t border-white/5">
                     <p>{stats.arena}, {stats.city}</p>
                  </div>
                </>
              )}

              {/* ESTATÍSTICAS DO TIME */}
              {activeTab === 'team_stats' && (
                <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 space-y-6">
                   <StatBar label="FG%" val1={stats.awayTeam.teamStats?.fieldGoalPct} val2={stats.homeTeam.teamStats?.fieldGoalPct} isPercent />
                   <StatBar label="3P%" val1={stats.awayTeam.teamStats?.threePointerPct} val2={stats.homeTeam.teamStats?.threePointerPct} isPercent />
                   <StatBar label="FT%" val1={stats.awayTeam.teamStats?.freeThrowPct} val2={stats.homeTeam.teamStats?.freeThrowPct} isPercent />
                   <div className="h-px bg-white/5 my-4" />
                   <StatBar label="Rebotes" val1={stats.awayTeam.teamStats?.rebounds} val2={stats.homeTeam.teamStats?.rebounds} />
                   <StatBar label="Assistências" val1={stats.awayTeam.teamStats?.assists} val2={stats.homeTeam.teamStats?.assists} />
                   <StatBar label="Turnovers" val1={stats.awayTeam.teamStats?.turnovers} val2={stats.homeTeam.teamStats?.turnovers} inverse />
                </div>
              )}

              {/* BOX SCORE */}
              {activeTab === 'boxscore' && (
                <div className="space-y-8">
                   <BoxScoreTable team={stats.awayTeam} />
                   <BoxScoreTable team={stats.homeTeam} />
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
               {loading ? 'Carregando...' : 'Dados indisponíveis.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componentes Visuais
const PlayerRow = ({ player, rank, maxVal, alignRight }: any) => (
  <div className={cn("flex items-center gap-3", alignRight ? "flex-row-reverse text-right" : "flex-row")}>
    <img 
       src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`} 
       onError={(e) => (e.currentTarget.src = 'https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png')}
       className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-white/10" 
    />
    <div className="flex-1 min-w-0">
       <div className={cn("flex items-end gap-2 mb-1", alignRight && "flex-row-reverse")}>
          <span className="text-sm font-bold text-zinc-200 truncate">{player.nameI}</span>
          <span className="text-sm font-black text-pink-500 font-oswald leading-none">{player.value}</span>
       </div>
       <div className={cn("h-1 bg-zinc-800 rounded-full overflow-hidden flex", alignRight && "justify-end")}>
          <div className="h-full bg-zinc-500" style={{ width: `${((player.value||0)/maxVal)*100}%` }} />
       </div>
    </div>
  </div>
);

const StatBar = ({ label, val1, val2, isPercent, inverse }: any) => {
  const v1 = parseFloat(val1 || 0);
  const v2 = parseFloat(val2 || 0);
  const total = v1 + v2 || 1;
  const p1 = (v1 / total) * 100;
  const p2 = (v2 / total) * 100;
  const win1 = inverse ? v1 < v2 : v1 > v2;
  const win2 = inverse ? v2 < v1 : v2 > v1;

  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className={win1 ? "text-white" : "text-zinc-500"}>{v1}{isPercent && '%'}</span>
        <span className="text-zinc-600 uppercase tracking-widest text-[10px]">{label}</span>
        <span className={win2 ? "text-white" : "text-zinc-500"}>{v2}{isPercent && '%'}</span>
      </div>
      <div className="flex h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all", win1 ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${p1}%` }} />
        <div className="w-0.5 bg-black" />
        <div className={cn("h-full transition-all", win2 ? "bg-pink-600" : "bg-zinc-600")} style={{ width: `${p2}%` }} />
      </div>
    </div>
  );
};

const BoxScoreTable = ({ team }: { team: TeamStats }) => (
  <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
    <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-2">
       <img src={team.logo} className="w-5 h-5" />
       <h3 className="font-bold text-zinc-300 text-sm uppercase">{team.name}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-zinc-950 text-zinc-500 border-b border-white/5">
           <tr>
             <th className="px-3 py-2 text-left">JOGADOR</th>
             <th className="px-2 py-2">MIN</th>
             <th className="px-2 py-2 text-white">PTS</th>
             <th className="px-2 py-2">REB</th>
             <th className="px-2 py-2">AST</th>
           </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
           {team.allPlayers.map((p) => (
             <tr key={p.id} className="hover:bg-white/5">
               <td className="px-3 py-2 text-zinc-300 whitespace-nowrap">{p.nameI}</td>
               <td className="px-2 py-2 text-center text-zinc-500 font-mono">{p.stats?.minutes}</td>
               <td className="px-2 py-2 text-center font-bold text-white bg-white/5">{p.stats?.points}</td>
               <td className="px-2 py-2 text-center text-zinc-400">{p.stats?.rebounds}</td>
               <td className="px-2 py-2 text-center text-zinc-400">{p.stats?.assists}</td>
             </tr>
           ))}
        </tbody>
      </table>
    </div>
  </div>
);