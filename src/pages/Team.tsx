import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getTeamBySlug } from '@/lib/nbaTeams';
import { Loader2, ArrowLeft, Shield, Users, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NotFound from './NotFound';

interface Player {
  personId: string;
  firstName: string;
  lastName: string;
  jerseyNum: string;
  position: string;
  height: string;
  weight: string;
  dateOfBirthUTC: string;
  hometown: string;
}

interface TeamInfo {
  roster: Player[];
  // Adicione mais tipos de dados conforme a Edge Function retornar
}

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const team = slug ? getTeamBySlug(slug) : undefined;

  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (!team) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: functionError } = await supabase.functions.invoke('nba-team-info', {
          body: { teamId: team.id },
        });

        if (functionError) throw functionError;
        if (!data.success) throw new Error(data.message || 'Failed to fetch team info');

        setTeamInfo({ roster: data.roster });
      } catch (err: any) {
        console.error('Error fetching team info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamInfo();
  }, [team]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!team) {
    return <NotFound />;
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gray-800 text-white py-20">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`} 
            alt={`${team.name} background`}
            className="w-full h-full object-contain opacity-5 scale-150 blur-lg"
          />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <img 
            src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`} 
            alt={`${team.name} logo`}
            className="h-40 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-6xl font-bold">{team.name}</h1>
          <p className="text-xl text-gray-300 mt-2">
            {team.conference} Conference • {team.division} Division
          </p>
          <Link to="/times" className="inline-flex items-center gap-2 mt-8 text-cyan-400 hover:text-cyan-300 transition">
            <ArrowLeft size={16} /> Voltar para todos os times
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {error && (
          <Card className="bg-red-100 border-red-500 text-red-800 mb-8">
            <CardHeader>
              <CardTitle>Ocorreu um erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {teamInfo?.roster && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users /> Elenco Atual (Roster)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">#</TableHead>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Pos.</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Altura</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamInfo.roster.map((player) => (
                      <TableRow key={player.personId}>
                        <TableCell className="font-bold text-lg">{player.jerseyNum}</TableCell>
                        <TableCell className="font-medium">{player.firstName} {player.lastName}</TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>{calculateAge(player.dateOfBirthUTC)}</TableCell>
                        <TableCell>{player.height}</TableCell>
                        <TableCell>{player.weight}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}