import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Flame, Snowflake, Minus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTeamColors } from '@/lib/nbaTeamColors';
import { NBA_TEAMS } from '@/lib/nbaTeams';
import PageMeta from '@/components/PageMeta';

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
  conference?: 'Leste' | 'Oeste';
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
  const [viewType, setViewType] = useState('geral');

  useEffect(() => {
    loadStandings();
    const interval = setInterval(loadStandings, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  const loadStandings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nba-standings');
      
      if (error) throw error;
      
      if (data?.standings) {
        const addSlugToTeams = (teams: any[]): Team[] => {
          if (!Array.isArray(teams)) return [];
          return teams.map(team => {
            // Usamos a abreviação da API (que pode ser 'NY', 'SA', 'GS', 'WSH') para encontrar o time no nosso mapa
            const teamInfo = NBA_TEAMS.find(t => t.abbreviation.toUpperCase() === team.abbreviation.toUpperCase());
            
            // Se não encontrar pela abreviação, tentamos encontrar pelo nome (fallback)
            if (!teamInfo) {
                const teamInfoByName = NBA_TEAMS.find(t => t.name.toLowerCase().includes(team.name.toLowerCase()));
                return {
                    ...team,
                    slug: teamInfoByName?.slug || team.abbreviation.toLowerCase(), // Fallback para slug da abreviação
                    name: teamInfoByName?.name || team.name,
                };
            }

            return {
              ...team,
              slug: teamInfo.slug, // Usamos o slug correto do nosso mapa (ex: 'knicks')
              abbreviation: teamInfo.abbreviation, // Usamos a abreviação oficial (ex: 'NYK')
              name: teamInfo.name, // Usamos o nome completo
            };
          });
        };

        const processedStandings: Standings = {
          eastern: {
            conference: addSlugToTeams(data.standings.eastern?.conference),
            divisions: {
              Atlantic: addSlugToTeams(data.standings.eastern?.divisions?.Atlantic),
              Central: addSlugToTeams(data.standings.eastern?.divisions?.Central),
              Southeast: addSlugToTeams(data.standings.eastern?.divisions?.Southeast),
            },
          },
          western: {
            conference: addSlugToTeams(data.standings.western?.conference),
            divisions: {
              Northwest: addSlugToTeams(data.standings.western?.divisions?.Northwest),
              Pacific: addSlugToTeams(data.standings.western?.divisions?.Pacific),
              Southwest: addSlugToTeams(data.standings.western?.divisions?.Southwest),
            },
          },
        };

        setStandings(processedStandings);
      }
    } catch (err) {
      console.error('Erro ao buscar standings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGeralStandings = () => {
    if (!standings) return [];
    
    const allTeams = [
      ...standings.eastern.conference.map(team => ({ ...team, conference: 'Leste' as const })),
      ...standings.western.conference.map(team => ({ ...team, conference: 'Oeste' as const }))
    ];
    
    // Corrigido: Ordenar por porcentagem de vitórias
    return allTeams.sort((a, b) => parseFloat(b.winPercent) - parseFloat(a.winPercent));
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

  const getRowStyle = (abbreviation: string) => {
    const colors = getTeamColors(abbreviation);
    
    return {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      borderLeft: `4px solid ${colors.primary}`,
    };
  };
  
  const getPrimaryColorStyle = (abbreviation: string) => {
    const colors = getTeamColors(abbreviation);
    return { color: colors.primary };
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

  // Ordenar conferências por porcentagem de vitórias
  const sortedEastern = standings?.eastern.conference.slice().sort((a, b) => parseFloat(b.winPercent) - parseFloat(a.winPercent));
  const sortedWestern = standings?.western.conference.slice().sort((a, b) => parseFloat(b.winPercent) - parseFloat(a.winPercent));

  return (
    <>
      <PageMeta
        title="Classificação NBA 2025-26 - Tabela Completa"
        description="Acompanhe a classificação atualizada da NBA, incluindo conferências Leste e Oeste, porcentagem de vitórias e sequências de jogos."
        canonicalPath="/classificacao"
      />
      <div className="min-h-screen bg-white text-gray-900 py-12">
        <div className="container mx-auto px-4">
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

          <div className="flex items-center justify-center gap-4 mb-8 p-3 bg-gray-100 border border-gray-200 rounded-xl">
            <div className="bg-gray-200 p-1.5 rounded-lg flex">
              <button
                onClick={() => setViewType('geral')}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                  viewType === 'geral'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Classificação Geral
              </button>
              <button
                onClick={() => setViewType('leste')}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                  viewType === 'leste'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Leste
              </button>
              <button
                onClick={() => setViewType('oeste')}
                className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                  viewType === 'oeste'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Oeste
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 mb-8">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div>Playoff direto (1-6)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500"></div>Play-in (7-10)</div>
            <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" />Time quente (4+ vitórias)</div>
            <div className="flex items-center gap-2"><Snowflake className="w-4 h-4 text-blue-400" />Time frio (4+ derrotas)</div>
          </div>

          {viewType === 'geral' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">TIME</th>
                    <th className="px-4 py-3 text-center">CONF</th>
                    <th className="px-4 py-3 text-center">V</th>
                    <th className="px-4 py-3 text-center">D</th>
                    <th className="px-4 py-3 text-center">%</th>
                    <th className="px-4 py-3 text-center">GB</th>
                    <th className="px-4 py-3 text-center">SEQ</th>
                  </tr>
                </thead>
                <tbody>
                  {getGeralStandings().map((team, index) => (
                    <tr 
                      key={team.id} 
                      className="border-b border-gray-200 transition-colors"
                      style={getRowStyle(team.abbreviation)}
                    >
                      <td className="px-4 py-3 font-bold" style={getPrimaryColorStyle(team.abbreviation)}>{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/times/${team.slug}`} className="flex items-center gap-3 group">
                          <img src={team.logo} alt={team.abbreviation} className="w-8 h-8" />
                          <div>
                            {/* Aplicando cor primária no nome e abreviação */}
                            <p className="font-bold group-hover:underline transition-colors" style={getPrimaryColorStyle(team.abbreviation)}>{team.abbreviation}</p>
                            <p className="text-xs text-gray-600">{team.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          team.conference === 'Leste' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {team.conference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-600">{team.wins}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-600">{team.losses}</td>
                      <td className="px-4 py-3 text-center">{team.winPercent}</td>
                      <td className="px-4 py-3 text-center">{team.gamesBehind}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          team.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {team.streak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(viewType === 'leste' || viewType === 'oeste') && (
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
                    {(viewType === 'leste' ? sortedEastern : sortedWestern)?.map((team, index) => (
                      <tr 
                        key={team.id} 
                        className="transition-colors"
                        style={getRowStyle(team.abbreviation)}
                      >
                        <td className="px-4 py-3 font-bold text-center" style={getPrimaryColorStyle(team.abbreviation)}>
                          <div className="relative w-8 h-8 flex items-center justify-center">
                            {getPlayoffSeedBadge(index + 1)}
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/times/${team.slug}`} className="flex items-center gap-3 group">
                            <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                            <div>
                              {/* Aplicando cor primária no nome e abreviação */}
                              <div className="font-bold flex items-center group-hover:underline transition-colors" style={getPrimaryColorStyle(team.abbreviation)}>
                                {team.abbreviation}
                                {isHotTeam(team) && <Flame className="w-3 h-3 text-orange-400 ml-1" />}
                                {isColdTeam(team) && <Snowflake className="w-3 h-3 text-blue-400 ml-1" />}
                              </div>
                              <div className="text-xs text-gray-600">{team.division}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{team.wins}</td>
                        <td className="px-4 py-3 text-center font-mono">{team.losses}</td>
                        <td className="px-4 py-3 text-center font-mono">{team.winPercent}</td>
                        <td className="px-4 py-3 text-center font-mono">{team.gamesBehind}</td>
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
        </div>
      </div>
    </>
  );
}