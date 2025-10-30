import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader2, TrendingUp, Award, Calendar } from 'lucide-react';
import PerformanceChart from '@/components/PerformanceChart';
import PlayerComparison from '@/components/PlayerComparison';

interface PlayerProfile {
  id: string;
  name: string;
  fullName: string;
  position: string;
  jersey: string;
  height: string;
  weight: string;
  age: number;
  birthDate: string;
  birthPlace: string;
  college: string;
  experience: number;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    color: string;
  };
  headshotLarge: string;
  stats: {
    season: string;
    gamesPlayed: number;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPct: number;
    threePointPct: number;
    freeThrowPct: number;
    plusMinus: number;
  };
  lastGames: Array<{
    id: string;
    date: string;
    opponent: string;
    opponentLogo: string;
    result: string;
    score: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: string;
    fieldGoals: string;
    threePointers: string;
    freeThrows: string;
  }>;
  awards: string[];
}

export default function Jogador() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlayer();
    }
  }, [id]);

  const loadPlayer = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('nba-player-profile', {
        body: { playerId: id }
      });

      if (error) {
        console.error('[JOGADOR] Erro:', error);
        return;
      }

      if (data?.success && data?.player) {
        setPlayer(data.player);
      }
    } catch (err) {
      console.error('[JOGADOR] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-300 text-8xl mb-6">❌</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Jogador não encontrado</h2>
          <Link to="/jogadores" className="text-pink-600 hover:text-pink-700 font-semibold">
            ← Voltar para lista de jogadores
          </Link>
        </div>
      </div>
    );
  }

  const teamColor = `#${player.team.color || '000000'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <Link
          to="/jogadores"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 font-semibold mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Jogadores
        </Link>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200 mb-8">
          <div
            className="relative h-64 bg-gradient-to-r from-gray-800 to-gray-900"
            style={{
              background: `linear-gradient(135deg, ${teamColor}dd 0%, ${teamColor}44 100%)`
            }}
          >
            {player.team.logo && (
              <img
                src={player.team.logo}
                alt={player.team.name}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-48 h-48 opacity-20"
              />
            )}
          </div>

          <div className="relative px-8 pb-8">
            <div className="absolute -top-32 left-8">
              <div className="relative">
                <img
                  src={player.headshotLarge || 'https://via.placeholder.com/300x300?text=No+Photo'}
                  alt={player.name}
                  className="w-48 h-48 rounded-3xl border-8 border-white shadow-2xl object-cover bg-gray-100"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Photo';
                  }}
                />
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-pink-600 to-purple-600 text-white font-black text-3xl px-6 py-3 rounded-2xl shadow-xl">
                  #{player.jersey}
                </div>
              </div>
            </div>

            <div className="pt-20 pl-56">
              <h1 className="text-5xl font-black text-gray-900 mb-2">
                {player.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                {player.team.logo && (
                  <img src={player.team.logo} alt={player.team.name} className="w-8 h-8" />
                )}
                <p className="text-xl text-gray-600 font-bold">
                  {player.team.name} • {player.position}
                </p>
              </div>
              <div className="flex items-center gap-6 text-gray-700 text-sm font-medium">
                <span>📏 {player.height}</span>
                <span>⚖️ {player.weight}</span>
                <span>🎂 {player.age} anos</span>
                <span>🎓 {player.college}</span>
                <span>⏱️ {player.experience} anos de NBA</span>
              </div>

              <button
                onClick={() => setShowComparison(true)}
                className="mt-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all hover:scale-105"
              >
                ⚖️ Comparar com outro jogador
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-600" />
              Estatísticas {player.stats.season}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'PTS', value: player.stats.points.toFixed(1), icon: '🏀' },
                { label: 'REB', value: player.stats.rebounds.toFixed(1), icon: '💪' },
                { label: 'AST', value: player.stats.assists.toFixed(1), icon: '🎯' },
                { label: 'FG%', value: player.stats.fieldGoalPct.toFixed(1) + '%', icon: '🎯' },
                { label: '3P%', value: player.stats.threePointPct.toFixed(1) + '%', icon: '🔥' },
                { label: 'FT%', value: player.stats.freeThrowPct.toFixed(1) + '%', icon: '🎪' },
                { label: 'STL', value: player.stats.steals.toFixed(1), icon: '🤚' },
                { label: 'BLK', value: player.stats.blocks.toFixed(1), icon: '🚫' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border-2 border-gray-200 hover:border-pink-500 transition-all hover:scale-105"
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-4xl font-black text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              {player.stats.gamesPlayed} jogos • {player.stats.minutes.toFixed(1)} min/jogo
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Conquistas
            </h2>

            {player.awards.length > 0 ? (
              <div className="space-y-3">
                {player.awards.map((award, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-white rounded-xl border border-yellow-200"
                  >
                    <span className="text-2xl">🏆</span>
                    <p className="text-sm text-gray-900 font-semibold">{award}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma conquista registrada
              </p>
            )}
          </div>
        </div>

        {player.lastGames.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              📈 Evolução de Desempenho (Últimos 10 Jogos)
            </h2>
            <PerformanceChart games={player.lastGames} />
          </div>
        )}

        {player.lastGames.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-600" />
              Últimos Jogos
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Adversário</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">Resultado</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">PTS</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">REB</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">AST</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-600">MIN</th>
                  </tr>
                </thead>
                <tbody>
                  {player.lastGames.map((game) => (
                    <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">{game.date}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {game.opponentLogo && (
                            <img src={game.opponentLogo} alt={game.opponent} className="w-6 h-6" />
                          )}
                          <span className="text-sm font-bold text-gray-900">{game.opponent}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                            game.result === 'W'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {game.result} {game.score}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-gray-900">{game.points}</td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-gray-900">{game.rebounds}</td>
                      <td className="py-4 px-4 text-center text-sm font-bold text-gray-900">{game.assists}</td>
                      <td className="py-4 px-4 text-center text-sm text-gray-600">{game.minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showComparison && (
        <PlayerComparison
          player1Id={player.id}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}