import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Game {
  id: string;
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface PerformanceChartProps {
  games: Game[];
}

export default function PerformanceChart({ games }: PerformanceChartProps) {
  const chartData = [...games].reverse().map((game) => ({
    game: `vs ${game.opponent}`,
    date: game.date,
    PTS: game.points,
    REB: game.rebounds,
    AST: game.assists
  }));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="game"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}
            itemStyle={{ color: '#6b7280', fontSize: '14px', fontWeight: '600' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          />
          <Line
            type="monotone"
            dataKey="PTS"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ fill: '#ec4899', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="Pontos"
          />
          <Line
            type="monotone"
            dataKey="REB"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="Rebotes"
          />
          <Line
            type="monotone"
            dataKey="AST"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ fill: '#06b6d4', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            name="Assistências"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}