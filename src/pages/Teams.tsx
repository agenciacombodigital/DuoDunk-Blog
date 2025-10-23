import { Link } from 'react-router-dom';
import { NBA_TEAMS, NBATeam } from '@/lib/nbaTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamsPage() {
  const eastTeams = NBA_TEAMS.filter(team => team.conference === 'East');
  const westTeams = NBA_TEAMS.filter(team => team.conference === 'West');

  const TeamList = ({ teams }: { teams: NBATeam[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {teams.map(team => (
        <Link 
          key={team.id} 
          to={`/times/${team.slug}`}
          className="group"
        >
          <Card className="bg-gray-50 hover:bg-white hover:shadow-lg hover:border-pink-500/50 transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
              <img 
                src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`} 
                alt={`${team.name} logo`}
                className="h-20 w-20 object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <p className="font-bold text-center text-sm text-gray-800 group-hover:text-pink-600">
                {team.name}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900">Times da NBA</h1>
          <p className="text-lg text-gray-600 mt-2">
            Explore informações, elencos e estatísticas de todas as 30 equipes.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-red-600 mb-6 border-b-2 border-red-600 pb-2">
              Conferência Leste
            </h2>
            <TeamList teams={eastTeams} />
          </section>

          <section>
            <h2 className="text-3xl font-bold text-blue-600 mb-6 border-b-2 border-blue-600 pb-2">
              Conferência Oeste
            </h2>
            <TeamList teams={westTeams} />
          </section>
        </div>
      </div>
    </div>
  );
}