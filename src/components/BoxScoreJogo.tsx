import { GameBoxScore, TeamBoxScore, PlayerStats } from '../services/nbaBoxScore';

interface BoxScoreJogoProps {
  boxScore: GameBoxScore;
}

export default function BoxScoreJogo({ boxScore }: BoxScoreJogoProps) {
  const vencedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.homeTeam 
    : boxScore.awayTeam;
  const perdedor = boxScore.homeTeam.score > boxScore.awayTeam.score 
    ? boxScore.awayTeam 
    : boxScore.homeTeam;

  return (
    <div className="my-8">
      {/* Placar Principal */}
      <div className="bg-gray-900 text-white rounded-t-xl p-6 border-b-4 border-pink-600">
        <div className="flex items-center justify-between">
          {/* Time Visitante */}
          <div className="flex-1 text-center">
            <h3 className={`font-oswald text-2xl font-bold ${perdedor.teamAbbr === boxScore.awayTeam.teamAbbr ? 'text-gray-400' : 'text-white'}`}>
              {boxScore.awayTeam.teamName}
            </h3>
            <p className="text-gray-500 text-sm">{boxScore.awayTeam.record}</p>
          </div>
          
          {/* Placar */}
          <div className="px-8">
            <div className="flex items-center gap-4">
              <span className={`font-oswald text-4xl font-bold ${perdedor.teamAbbr === boxScore.awayTeam.teamAbbr ? 'text-gray-400' : 'text-white'}`}>
                {boxScore.awayTeam.score}
              </span>
              <span className="text-pink-600 text-2xl font-bold">VS</span>
              <span className={`font-oswald text-4xl font-bold ${perdedor.teamAbbr === boxScore.homeTeam.teamAbbr ? 'text-gray-400' : 'text-white'}`}>
                {boxScore.homeTeam.score}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">FINAL</p>
          </div>

          {/* Time da Casa */}
          <div className="flex-1 text-center">
            <h3 className={`font-oswald text-2xl font-bold ${perdedor.teamAbbr === boxScore.homeTeam.teamAbbr ? 'text-gray-400' : 'text-white'}`}>
              {boxScore.homeTeam.teamName}
            </h3>
            <p className="text-gray-500 text-sm">{boxScore.homeTeam.record}</p>
          </div>
        </div>
      </div>

      {/* Tabelas de Estatísticas */}
      <div className="grid md:grid-cols-2 gap-6 p-6 bg-white rounded-b-xl shadow-lg border border-gray-200">
        {/* Time Visitante */}
        <div>
          <h4 className="font-oswald text-xl font-bold mb-4 text-gray-900">
            {boxScore.awayTeam.teamName}
          </h4>
          <TabelaEstatisticas team={boxScore.awayTeam} />
        </div>

        {/* Time da Casa */}
        <div>
          <h4 className="font-oswald text-xl font-bold mb-4 text-gray-900">
            {boxScore.homeTeam.teamName}
          </h4>
          <TabelaEstatisticas team={boxScore.homeTeam} />
        </div>
      </div>
    </div>
  );
}

function TabelaEstatisticas({ team }: { team: TeamBoxScore }) {
  return (
    <>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-inter text-xs uppercase">
              <th className="px-3 py-2 text-left">Jogador</th>
              <th className="px-2 py-2 text-center">PTS</th>
              <th className="px-2 py-2 text-center">REB</th>
              <th className="px-2 py-2 text-center">AST</th>
              <th className="px-2 py-2 text-center hidden sm:table-cell">STL</th>
              <th className="px-2 py-2 text-center hidden sm:table-cell">BLK</th>
              <th className="px-2 py-2 text-center hidden lg:table-cell">FG%</th>
              <th className="px-2 py-2 text-center hidden lg:table-cell">3P%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {team.players.map((player, index) => (
              <tr 
                key={player.playerId}
                className={`hover:bg-gray-50 ${index === 0 ? 'bg-pink-50 border-l-4 border-pink-600' : ''}`}
              >
                <td className="px-3 py-3 font-inter font-semibold text-gray-900 whitespace-nowrap">
                  {player.nome}
                </td>
                <td className="px-2 py-3 text-center font-oswald font-bold text-pink-600">
                  {player.pts}
                </td>
                <td className="px-2 py-3 text-center text-gray-700">
                  {player.reb}
                </td>
                <td className="px-2 py-3 text-center text-gray-700">
                  {player.ast}
                </td>
                <td className="px-2 py-3 text-center text-gray-700 hidden sm:table-cell">
                  {player.stl}
                </td>
                <td className="px-2 py-3 text-center text-gray-700 hidden sm:table-cell">
                  {player.blk}
                </td>
                <td className="px-2 py-3 text-center text-gray-700 hidden lg:table-cell">
                  {player.fgPct}
                </td>
                <td className="px-2 py-3 text-center text-gray-700 hidden lg:table-cell">
                  {player.threePtPct}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-xs text-gray-600 mt-3 font-inter">
        <strong>Três pontos do time:</strong> {team.teamThreePt} | Melhor: {team.topThreePointShooter}
      </p>
    </>
  );
}