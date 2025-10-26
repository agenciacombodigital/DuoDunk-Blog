import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, TrendingUp, TrendingDown, Minus, Flame, Snowflake, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  winPercent: string;
  gamesBehind: string;
  streak: string;
  pointsFor: number;
  pointsAgainst: number;
  differential: string;
  clinched: boolean;
  division: string;
  playoffSeed: number;
  slug: string;
}

interface Standings {
  eastern: {
    conference: Team[];
    divisions: {
      Atlantic: Team[];
      Central: Team[];
      Southeast: Team[];
    };
  };
  western: {
    conference: Team[];
    divisions: {
      Northwest: Team[];
      Pacific: Team[];
      Southwest: Team[];
    };
  };
}

export default function Classificacao() {
  const [standings, setStandings] = useState<Standings | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('conference');
  const [selectedConference, setSelectedConference] = useState('eastern');

  useEffect(() => {
    loadStandings();
    const interval = setInterval(loadStandings, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  const loadStandings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-standings');
      
      if (error) throw error;
      
      if (data?.success && data?.standings) {
        setStandings(data.standings);
      }
    } catch (err) {
      console.error('Erro ao buscar standings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStreakIcon = (streak: string) => {
    if (streak.startsWith('W')) {
      return <Flame className="w-4 h-4 text-orange-400" />;
    } else if (streak.startsWith('L')) {
      return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getStreakColor = (streak: string) => {
    const num = parseInt(streak.slice(1));
    if (streak.startsWith('W')) {
      if (num >= 5) return 'text-green-400 font-bold';
      return 'text-green-500';
    } else if (streak.startsWith('L')) {
      if (num >= 5) return 'text-red-400 font-bold';
      return 'text-red-500';
    }
    return 'text-gray-400';
  };

  const getPlayoffSeedBadge = (seed: number) => {
    if (seed <= 6) {
      return (
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full flex items-center justify-center text-xs font-bold">
          {seed}
        </div>
      );
    } else if (seed <= 10) {
      return (
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full flex items-center justify-center text-xs font-bold">
          {seed}
        </div>
      );
    }
    return null;
  };

  const isHotTeam = (team: Team) => {
    return team.streak.startsWith('W') && parseInt(team.streak.slice(1)) >= 4;
  };

  const isColdTeam = (team: Team) => {
    return team.streak.startsWith('L') && parseInt(team.streak.slice(1)) >= 4;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
            <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping"></div>
          </div>
          <p className="text-gray-600">Carregando classificação...</p>
        </div>
      </div>
    );
  }

  const currentStandings = selectedConference === 'eastern' 
    ? standings?.eastern 
    : standings?.western;

  return (
    <div className="min-h-screen bg-white text-gray-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl font-black">
              Classificação NBA
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Classificação NBA 2025-26
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-3 bg-gray-100 border border-gray-200 rounded-xl">
          {/* Conference Toggle */}
          <div className="bg-gray-200 p-1.5 rounded-lg flex">
            <button
              onClick={() => setSelectedConference('eastern')}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                selectedConference === 'eastern'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Leste
            </button>
            <button
              onClick={() => setSelectedConference('western')}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                selectedConference === 'western'
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Oeste
            </button>
          </div>

          {/* View Toggle */}
          <div className="bg-gray-200 p-1.5 rounded-lg flex">
            <button
              onClick={() => setView('conference')}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                view === 'conference'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Conferência
            </button>
            <button
              onClick={() => setView('divisions')}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                view === 'divisions'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              Divisões
            </button>
          </div>
        </div>

        {/* Legends */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 mb-8">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div>Playoff direto (1-6)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500"></div>Play-in (7-10)</div>
          <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" />Time quente (4+ vitórias)</div>
          <div className="flex items-center gap-2"><Snowflake className="w-4 h-4 text-blue-400" />Time frio (4+ derrotas)</div>
        </div>

        {/* Conference View */}
        {view === 'conference' && currentStandings && (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl p-2 shadow-lg">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-4 w-12">#</th>
                  <th className="px-4 py-4">TIME</th>
                  <th className="px-4 py-4 text-center">V</th>
                  <th className="px-4 py-4 text-center">D</th>
                  <th className="px-4 py-4 text-center">%</th>
                  <th className="px-4 py-4 text-center">GB</th>
                  <th className="px-4 py-4 text-center">DIFF</th>
                  <th className="px-4 py-4 text-center">SEQUÊNCIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {currentStandings.conference.map((team, index) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-400 text-center">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                          {getPlayoffSeedBadge(index + 1)}
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/times/${team.slug}`} className="flex items-center gap-3 group">
                          <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                          <div>
                            <div className="font-bold text-gray-800 flex items-center group-hover:text-pink-600 transition-colors">
                              {team.abbreviation}
                              {isHotTeam(team) && <Flame className="w-3 h-3 text-orange-400 ml-1" />}
                              {isColdTeam(team) && <Snowflake className="w-3 h-3 text-blue-400 ml-1" />}
                            </div>
                            <div className="text-xs text-gray-500">{team.division}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">{team.wins}</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">{team.losses}</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">{team.winPercent}</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-700">{team.gamesBehind}</td>
                      <td className={`px-4 py-3 text-center font-mono font-bold ${parseInt(team.differential) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {team.differential}
                      </td>
                      <td className={`px-4 py-3 text-center font-mono font-bold ${getStreakColor(team.streak)}`}>
                        <div className="flex items-center justify-center gap-2">
                          {getStreakIcon(team.streak)}
                          {team.streak}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Divisions View */}
        {view === 'divisions' && currentStandings && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(currentStandings.divisions).map(([divisionName, teams]) => {
              // Pular divisões vazias
              if (!teams || teams.length === 0) {
                return null;
              }
              
              return (
                <div key={divisionName} className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 text-center text-pink-600">
                    {divisionName}
                  </h3>
                  <div className="space-y-2">
                    {teams.map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                        <Link to={`/times/${team.slug}`} className="flex items-center gap-3 group">
                          <span className="font-bold text-gray-400 w-5">{index + 1}</span>
                          <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
                          <div>
                            <div className="font-bold text-gray-800 flex items-center text-sm group-hover:text-pink-600 transition-colors">
                              {team.abbreviation}
                              {isHotTeam(team) && <Flame className="w-3 h-3 text-orange-400 ml-1" />}
                              {isColdTeam(team) && <Snowflake className="w-3 h-3 text-blue-400 ml-1" />}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{team.wins}-{team.losses}</div>
                          </div>
                        </Link>
                        <div className={`flex items-center gap-1 text-xs font-mono font-bold ${getStreakColor(team.streak)}`}>
                          {getStreakIcon(team.streak)}
                          <span>{team.streak}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}