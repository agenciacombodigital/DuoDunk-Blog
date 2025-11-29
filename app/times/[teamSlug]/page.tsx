import { getTeamBySlug, getTeamById } from '@/lib/nbaTeams';
import { 
  Users, TrendingUp, Calendar, Award, 
  ArrowLeft, Trophy, TrendingDown, Clock,
  MapPin, Tv
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';
import TeamLogo from '@/components/TeamLogo'; // Importando o novo componente
import TeamTabs from '@/components/TeamTabs'; // Importando o novo Client Component

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
      score: any;
      winner: boolean;
    };
    awayTeam: {
      id: string;
      name: string;
      logo: string;
      score: any;
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const mesesPT = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];
  
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = mesesPT[date.getMonth()];
  const hora = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  
  return `${dia} ${mes}, ${hora}:${min}`;
};

const getLogo = (logo: any, fallbackAbbr?: string): string => {
  if (typeof logo === 'string' && logo.length > 0) return logo;
  if (logo?.logos && Array.isArray(logo.logos) && logo.logos.length > 0) {
    return logo.logos[0].href || logo.logos[0].url || '';
  }
  if (logo?.href) return logo.href;
  if (logo?.url) return logo.url;
  if (fallbackAbbr) {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${fallbackAbbr.toLowerCase()}.png`;
  }
  return '';
};

const getScoreDisplay = (score: any): string => {
  if (typeof score === 'string' || typeof score === 'number') {
    return String(score);
  }
  if (typeof score === 'object' && score !== null) {
    if (score.displayValue) return score.displayValue;
    if (score.display) return score.display;
    if (score.value) return String(score.value);
  }
  return '?';
};

async function loadTeamData(teamInfo: any): Promise<TeamData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('nba-team-info', {
      body: { 
        teamId: teamInfo.id,
        abbreviation: teamInfo.abbreviation
      }
    });

    if (error) {
      console.error('Erro ao buscar time:', error);
      return null;
    } else if (data?.success) {
      return data as TeamData;
    }
    return null;
  } catch (err) {
    console.error('Erro:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { teamSlug: string } }): Promise<Metadata> {
  const teamInfo = getTeamBySlug(params.teamSlug);

  if (!teamInfo) {
    return {
      title: 'Time não encontrado',
      description: 'Informações sobre o time da NBA não disponíveis.',
    };
  }

  const teamData = await loadTeamData(teamInfo);
  const teamName = teamData?.team.name || teamInfo.name;
  const conference = teamData?.team.conference || teamInfo.conference;

  return {
    title: `${teamName} - Notícias, Elenco e Estatísticas`,
    description: `Tudo sobre o ${teamName}: elenco, estatísticas, jogos recentes e próximos confrontos. Acompanhe o time na ${conference} Conference.`,
    alternates: {
      canonical: `https://www.duodunk.com.br/times/${params.teamSlug}`,
    },
  };
}

export default async function Time({ params }: { params: { teamSlug: string } }) {
  const teamInfo = getTeamBySlug(params.teamSlug);
  const teamData = teamInfo ? await loadTeamData(teamInfo) : null;

  if (!teamInfo || !teamData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Time não encontrado</h1>
          <p className="text-gray-600 mb-8">Não conseguimos encontrar informações sobre este time.</p>
          <Link
            href="/times"
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
            href="/times"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
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
        <TeamTabs teamData={teamData} teamInfo={teamInfo} />
      </div>
    </div>
  );
}