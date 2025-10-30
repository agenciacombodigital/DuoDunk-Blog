import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Game {
  date: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface Props {
  games: Game[];
}

export default function PerformanceChart({ games }: Props) {
  const data = games.map(game => ({
    date: game.date,
    Pontos: game.points,
    Rebotes: game.rebounds,
    Assistências: game.assists,
  })).reverse(); // Reverse to show oldest to newest

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="date" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid #ccc',
              borderRadius: '10px',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="Pontos" stroke="#FA007D" strokeWidth={3} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Rebotes" stroke="#00DBFB" strokeWidth={2} />
          <Line type="monotone" dataKey="Assistências" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}