import { useEffect, useState } from 'react';
import { RefreshCw, X, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface GameLeader {
  name: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface TeamStatistics {
  fieldGoalsPercentage: number;
  threePointersPercentage: number;
  freeThrowsPercentage: number;
  reboundsTotal: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

interface Team {
  name: string;
  tricode: string;
  score: number;
  logo: string;
  leaders: GameLeader | null;
  wins: number;
  losses: number;
  statistics: TeamStatistics | null;
}

interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'final' | 'live' | 'scheduled';
  statusText: string;
  period: number;
  gameClock: string;
}

// Helper component para a linha de estatística no modal
const StatRow = ({ label, awayValue, homeValue }: { label: string, awayValue: string | number, homeValue: string | number }) => {
  const awayNum = parseFloat(String(awayValue));
  const homeNum = parseFloat(String(homeValue));
  
  const isAwayBetter = label === 'Turnovers' ? awayNum < homeNum : awayNum > homeNum;
  const isHomeBetter = label === 'Turnovers' ? homeNum < awayNum : homeNum > awayNum;

  return (
    <div className="flex items-center justify-between text-sm py-2.5 border-b border-gray-800 last:border-b-0">
      <span className={`font-bold w-1/3 text-left ${isAwayBetter ? 'text-white' : 'text-gray-400'}`}>{awayValue}</span>
      <span className="text-gray-500 w-1/3 text-center">{label}</span>
      <span className={`font-bold w-1/3 text-right ${isHomeBetter ? 'text-white' : 'text-gray-400'}`}>{homeValue}</span>
    </div>
  );
};

export default function NBAScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(() => {
      setGames(currentGames => {
        if (currentGames.some(g => g.status === 'live')) fetchGames();
        return currentGames;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      setError(false);
      const { data, error: functionError } = await supabase.functions.invoke('nba-scoreboard');
      if (functionError) throw new Error(functionError.message);
      if (!data?.scoreboard?.games?.length) {
        setGames([]);
        setLoading(false);
        return;
      }

      const formattedGames: Game[] = data.scoreboard.games.map((game: any) => ({
        id: game.gameId,
        homeTeam: {
          name: game.homeTeam.teamName,
          tricode: game.homeTeam.teamTricode,
          score: game.homeTeam.score || 0,
          logo: `https://cdn.nba.com/logos/nba/${game.homeTeam.teamId}/primary/L/logo.svg`,
          wins: game.homeTeam.wins || 0,
          losses: game.homeTeam.losses || 0,
          leaders: game.gameLeaders?.homeLeaders?.personId ? {
            name: game.gameLeaders.homeLeaders.name,
            points: game.gameLeaders.homeLeaders.points,
            rebounds: game.gameLeaders.homeLeaders.rebounds,
            assists: game.gameLeaders.homeLeaders.assists,
          } : null,
          statistics: game.homeTeam.statistics ? {
            fieldGoalsPercentage: game.homeTeam.statistics.fieldGoalsPercentage,
            threePointersPercentage: game.homeTeam.statistics.threePointersPercentage,
            freeThrowsPercentage: game.homeTeam.statistics.freeThrowsPercentage,
            reboundsTotal: game.homeTeam.statistics.reboundsTotal,
            assists: game.homeTeam.statistics.assists,
            steals: game.homeTeam.statistics.steals,
            blocks: game.homeTeam.statistics.blocks,
            turnovers: game.homeTeam.statistics.turnovers,
          } : null,
        },
        awayTeam: {
          name: game.awayTeam.teamName,
          tricode: game.awayTeam.teamTricode,
          score: game.awayTeam.score || 0,
          logo: `https://cdn.nba.com/logos/nba/${game.awayTeam.teamId}/primary/L/logo.svg`,
          wins: game.awayTeam.wins || 0,
          losses: game.awayTeam.losses || 0,
          leaders: game.gameLeaders?.awayLeaders?.personId ? {
            name: game.gameLeaders.awayLeaders.name,
            points: game.gameLeaders.awayLeaders.points,
            rebounds: game.gameLeaders.awayLeaders.rebounds,
            assists: game.gameLeaders.awayLeaders.assists,
          } : null,
          statistics: game.awayTeam.statistics ? {
            fieldGoalsPercentage: game.awayTeam.statistics.fieldGoalsPercentage,
            threePointersPercentage: game.awayTeam.statistics.threePointersPercentage,
            freeThrowsPercentage: game.awayTeam.statistics.freeThrowsPercentage,
            reboundsTotal: game.awayTeam.statistics.reboundsTotal,
            assists: game.awayTeam.statistics.assists,
            steals: game.awayTeam.statistics.steals,
            blocks: game.awayTeam.statistics.blocks,
            turnovers: game.awayTeam.statistics.turnovers,
          } : null,
        },
        status: game.gameStatus === 2 ? 'live' : game.gameStatus === 3 ? 'final' : 'scheduled',
        statusText: game.gameStatusText.trim(),
        period: game.period || 0,
        gameClock: game.gameClock || '',
      }));
      
      setGames(formattedGames);
    } catch (err: any) {
      console.error('❌ Erro ao buscar jogos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-black border-b border-gray-800 py-4 flex items-center justify-center gap-3"><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /><p className="text-gray-400 text-sm">Carregando jogos da NBA...</p></div>;
  if (error) return <div className="bg-black border-b border-gray-800 py-4 flex items-center justify-center gap-3"><p className="text-gray-400 text-sm">Erro ao carregar placar</p><button onClick={fetchGames} className="text-cyan-400 hover:text-cyan-300 text-sm underline">Tentar novamente</button></div>;
  if (games.length === 0) return <div className="bg-black border-b border-gray-800 py-4"><p className="text-gray-400 text-center text-sm">Nenhum jogo da NBA hoje 🏀</p></div>;

  return (
    <>
      <div className="bg-black border-b border-gray-800 py-3 sticky top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="relative group">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
            <div className="flex items-center gap-4 overflow-x-auto scoreboard-scrollbar pb-2 scroll-smooth">
              {games.map((game) => (
                <button key={game.id} onClick={() => setSelectedGame(game)} className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-sm px-5 py-3 rounded-xl min-w-max hover:bg-gray-800 transition-all duration-300 border border-gray-800 hover:border-cyan-500/50 hover:scale-105 cursor-pointer group/card">
                  <div className="flex items-center gap-2.5"><img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-7 h-7 object-contain" /><div className="text-right"><p className="text-white font-bold text-xs tracking-wider">{game.awayTeam.tricode}</p><p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">{game.awayTeam.score}</p></div></div>
                  <div className="text-gray-600 font-bold text-xs px-1">@</div>
                  <div className="flex items-center gap-2.5"><div className="text-left"><p className="text-white font-bold text-xs tracking-wider">{game.homeTeam.tricode}</p><p className="text-xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">{game.homeTeam.score}</p></div><img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-7 h-7 object-contain" /></div>
                  <div className="ml-3 text-center min-w-[100px]">
                    {game.status === 'live' && <><span className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] rounded-full animate-pulse font-bold flex items-center gap-1 justify-center shadow-lg shadow-red-500/50"><span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>AO VIVO</span><p className="text-gray-400 text-[10px] font-mono mt-1">{game.period}Q • {game.gameClock.replace('PT', '').replace('S', '').substring(0, 5)}</p></>}
                    {game.status === 'final' && <span className="px-3 py-1 bg-gray-700/80 text-gray-300 text-[10px] rounded-full font-bold">FINAL</span>}
                    {game.status === 'scheduled' && <span className="px-2.5 py-1 bg-gray-800/80 text-gray-400 text-[10px] rounded-full font-medium">{game.statusText}</span>}
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-600 group-hover/card:text-cyan-400 transition-colors ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedGame(null)}>
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 border border-gray-800 relative fade-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Estatísticas do Jogo</h2>
            <div className="flex items-center justify-between mb-6 bg-black/50 rounded-xl p-6">
              <div className="flex flex-col items-center flex-1"><img src={selectedGame.awayTeam.logo} alt={selectedGame.awayTeam.name} className="w-16 h-16 mb-2" /><p className="text-sm text-white font-bold mb-1">{selectedGame.awayTeam.name}</p><p className="text-xs text-gray-400 mb-2">{`(${selectedGame.awayTeam.wins}-${selectedGame.awayTeam.losses})`}</p><p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">{selectedGame.awayTeam.score}</p></div>
              <div className="text-center px-6"><span className={`px-4 py-2 text-sm rounded-full font-bold ${selectedGame.status === 'live' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>{selectedGame.status === 'live' ? 'AO VIVO' : 'FINAL'}</span><p className="text-gray-400 text-xs mt-2">{selectedGame.period}Q • {selectedGame.statusText}</p></div>
              <div className="flex flex-col items-center flex-1"><img src={selectedGame.homeTeam.logo} alt={selectedGame.homeTeam.name} className="w-16 h-16 mb-2" /><p className="text-sm text-white font-bold mb-1">{selectedGame.homeTeam.name}</p><p className="text-xs text-gray-400 mb-2">{`(${selectedGame.homeTeam.wins}-${selectedGame.homeTeam.losses})`}</p><p className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-pink-400 bg-clip-text text-transparent">{selectedGame.homeTeam.score}</p></div>
            </div>
            
            <div className="space-y-6">
              {selectedGame.awayTeam.statistics && selectedGame.homeTeam.statistics ? (
                <div>
                  <h3 className="text-lg font-bold text-white text-center mb-4">Estatísticas da Equipe</h3>
                  <div className="bg-black/30 rounded-lg p-4">
                    <StatRow label="FG%" awayValue={`${(selectedGame.awayTeam.statistics.fieldGoalsPercentage * 100).toFixed(1)}%`} homeValue={`${(selectedGame.homeTeam.statistics.fieldGoalsPercentage * 100).toFixed(1)}%`} />
                    <StatRow label="3P%" awayValue={`${(selectedGame.awayTeam.statistics.threePointersPercentage * 100).toFixed(1)}%`} homeValue={`${(selectedGame.homeTeam.statistics.threePointersPercentage * 100).toFixed(1)}%`} />
                    <StatRow label="FT%" awayValue={`${(selectedGame.awayTeam.statistics.freeThrowsPercentage * 100).toFixed(1)}%`} homeValue={`${(selectedGame.homeTeam.statistics.freeThrowsPercentage * 100).toFixed(1)}%`} />
                    <StatRow label="Rebotes" awayValue={selectedGame.awayTeam.statistics.reboundsTotal} homeValue={selectedGame.homeTeam.statistics.reboundsTotal} />
                    <StatRow label="Assistências" awayValue={selectedGame.awayTeam.statistics.assists} homeValue={selectedGame.homeTeam.statistics.assists} />
                    <StatRow label="Turnovers" awayValue={selectedGame.awayTeam.statistics.turnovers} homeValue={selectedGame.homeTeam.statistics.turnovers} />
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center">Estatísticas da equipe não disponíveis no momento.</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-cyan-400 mb-3">Destaque {selectedGame.awayTeam.tricode}</h3>
                  {selectedGame.awayTeam.leaders ? (
                    <div>
                      <p className="text-white font-semibold mb-2">{selectedGame.awayTeam.leaders.name}</p>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>{selectedGame.awayTeam.leaders.points} PTS / {selectedGame.awayTeam.leaders.rebounds} REB / {selectedGame.awayTeam.leaders.assists} AST</p>
                      </div>
                    </div>
                  ) : <p className="text-gray-500 text-sm">Não disponível</p>}
                </div>
                <div className="bg-black/30 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-pink-400 mb-3">Destaque {selectedGame.homeTeam.tricode}</h3>
                  {selectedGame.homeTeam.leaders ? (
                    <div>
                      <p className="text-white font-semibold mb-2">{selectedGame.homeTeam.leaders.name}</p>
                      <div className="space-y-1 text-sm text-gray-300">
                        <p>{selectedGame.homeTeam.leaders.points} PTS / {selectedGame.homeTeam.leaders.rebounds} REB / {selectedGame.homeTeam.leaders.assists} AST</p>
                      </div>
                    </div>
                  ) : <p className="text-gray-500 text-sm">Não disponível</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}