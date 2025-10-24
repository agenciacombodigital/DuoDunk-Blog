import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getTeamBySlug } from '@/lib/nbaTeams';
import { 
  Users, TrendingUp, Calendar, Award, 
  ArrowLeft, Trophy, TrendingDown, Clock,
  MapPin, Tv
} from 'lucide-react';

interface TeamData {
  team: {
    id: string;
    name: string;
    nickname: string;
    abbreviation: string;
    logo: string;
    color: string;
    alternateColor: string;
    location: string;
    conference: string;
    division: string;
    founded: string;
    venue: {
      name: string;
      city: string;
      capacity: number;
    };
  };
  record: {
    wins: number;
    losses: number;
    winPercent: string;
    standingSummary: string;
    gamesPlayed: number;
    streak: string;
  };
  roster: Array<{
    id: string;
    name: string;
    fullName: string;
    position: string;
    jersey: string;
    age: string;
    height: string;
    weight: string;
    headshot: string;
    experience: number;
    college: string;
  }>;
  pastGames: Array<{
    id: string;
    date: string;
    name: string;
    shortName: string;
    homeTeam: {
      id: string;
      name: string;
      logo: string;
      score: string;
      winner: boolean;
    };
    awayTeam: {
      id: string;
      name: string;
      logo: string;
      score: string;
      winner: boolean;
    };
    status: string;
  }>;
  upcomingGames: Array<{
    id: string;
    date: string;
    name: string;
    shortName: string;
    homeTeam: {
      id: string;
      name: string;
      logo: string;
    };
    awayTeam: {
      id: string;
      name: string;
      logo: string;
    };
    venue: string;
    broadcast: string;
  }>;
}

export default function Time() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'games'>('roster');

  const teamInfo = teamSlug ? getTeamBySlug(teamSlug) : null;

  useEffect(() => {
    if (teamInfo) {
      loadTeamData();
    } else {
      setLoading(false);
    }
  }, [teamSlug]);

  const loadTeamData = async () => {
    if (!teamInfo) return;

    try {
      const { data, error } = await supabase.functions.invoke('nba-team-info', {
        body: { teamId: teamInfo.id }
      });

      if (error) {
        console.error('Erro ao buscar time:', error);
      } else if (data?.success) {
        setTeamData(data);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 🔧 HELPER PARA GARANTIR QUE LOGO É STRING
  const getLogo = (logo: any): string => {
    if (typeof logo === 'string') return logo;
    if (logo?.href) return logo.href;
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações do time...</p>
        </div>
      </div>
    );
  }

  if (!teamInfo || !teamData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Time não encontrado</h1>
          <p className="text-gray-600 mb-8">Não conseguimos encontrar informações sobre este time.</p>
          <Link
            to="/times"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Times
          </Link>
        </div>
      </div>
    );
  }

  const { team, record, roster, pastGames, upcomingGames } = teamData;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div 
        className="relative py-16 sm:py-20"
        style={{ 
          background: `linear-gradient(135deg, #${team.color} 0%, #${team.alternateColor} 100%)` 
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/times"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full"></div>
              <img 
                src={team.logo} 
                alt={team.name}
                className="relative w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-2xl"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
                {team.location} {team.nickname}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-white/90">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {team.venue.city}
                </span>
                <span>•</span>
                <span>{team.conference} Conference</span>
                <span>•</span>
                <span>{team.division} Division</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-xs sm:text-sm font-medium text-green-900">Vitórias</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-green-600">{record.wins}</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 sm:p-6 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-xs sm:text-sm font-medium text-red-900">Derrotas</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-red-600">{record.losses}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-blue-900">% Vitórias</span>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-blue-600">
              {(parseFloat(record.winPercent) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-purple-900">Posição</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-purple-600">
              {record.standingSummary || 'N/D'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 sm:px-6 py-3 font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'roster'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Elenco ({roster.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 sm:px-6 py-3 font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'games'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            Jogos
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'roster' && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              👥 Elenco 2024-25
            </h2>
            
            {roster.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roster.map((player) => (
                  <div 
                    key={player.id}
                    className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition border border-gray-200 group"
                  >
                    <div className="flex items-start gap-4">
                      {player.headshot ? (
                        <img 
                          src={player.headshot} 
                          alt={player.name}
                          className="w-16 h-16 rounded-full object-cover bg-gray-200 flex-shrink-0 group-hover:scale-110 transition"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <Users className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {player.jersey && (
                            <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-xs font-bold flex-shrink-0">
                              #{player.jersey}
                            </span>
                          )}
                          <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                            {player.position}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 truncate">
                          {player.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          {player.height && <span>{player.height}</span>}
                          {player.weight && <span>• {player.weight}</span>}
                          {player.age && <span>• {player.age} anos</span>}
                        </div>
                        {player.college && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{player.college}</p>
                        )}
                        {player.experience > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {player.experience} {player.experience === 1 ? 'ano' : 'anos'} de NBA
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-12">Elenco não disponível no momento</p>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-8">
            {/* Últimos Jogos */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                📊 Últimos 5 Jogos
              </h2>
              
              {pastGames.length > 0 ? (
                <div className="space-y-4">
                  {pastGames.map((game) => {
                    const isHomeGame = String(game.homeTeam.id) === String(team.id);
                    const teamScore = isHomeGame ? game.homeTeam.score : game.awayTeam.score;
                    const opponentScore = isHomeGame ? game.awayTeam.score : game.homeTeam.score;
                    const opponent = isHomeGame ? game.awayTeam : game.homeTeam;
                    const won = (isHomeGame ? game.homeTeam.winner : game.awayTeam.winner) === true;

                    return (
                      <div 
                        key={game.id}
                        className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                              won 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {won ? 'V' : 'D'}
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              <img 
                                src={team.logo} 
                                alt={team.abbreviation}
                                className="w-10 h-10 object-contain"
                              />
                              <span className="font-bold text-gray-900 text-lg">
                                {teamScore}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className="font-bold text-gray-900 text-lg">
                                {opponentScore}
                              </span>
                              <img 
                                src={getLogo(opponent.logo)}
                                alt={opponent.name}
                                className="w-10 h-10 object-contain"
                              />
                              <span className="text-gray-900 font-medium hidden sm:block">
                                {opponent.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {formatDate(game.date)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">Nenhum jogo recente</p>
              )}
            </div>

            {/* Próximos Jogos */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                📅 Próximos Jogos
              </h2>
              
              {upcomingGames.length > 0 ? (
                <div className="space-y-4">
                  {upcomingGames.map((game) => {
                    const isHomeGame = String(game.homeTeam.id) === String(team.id);
                    const opponent = isHomeGame ? game.awayTeam : game.homeTeam;

                    return (
                      <div 
                        key={game.id}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              {isHomeGame ? 'CASA' : 'FORA'}
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              <img 
                                src={team.logo} 
                                alt={team.abbreviation}
                                className="w-10 h-10 object-contain"
                              />
                              <span className="text-gray-400 font-bold text-lg">VS</span>
                              <img 
                                src={getLogo(opponent.logo)}
                                alt={opponent.name}
                                className="w-10 h-10 object-contain"
                              />
                              <span className="text-gray-900 font-medium hidden sm:block">
                                {opponent.name}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                              <Clock className="w-4 h-4" />
                              {formatDate(game.date)}
                            </div>
                            {game.broadcast && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Tv className="w-3.5 h-3.5" />
                                {game.broadcast}
                              </div>
                            )}
                            {game.venue && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin className="w-3.5 h-3.5" />
                                {game.venue}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">Nenhum jogo agendado</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}