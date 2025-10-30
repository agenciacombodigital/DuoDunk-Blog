import { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader2, MapPin, Tv } from 'lucide-react';
import { NBA_TEAMS, NBATeam } from '@/lib/nbaTeams';

// --- INÍCIO DA LÓGICA DE SIMULAÇÃO ---

// Função para gerar um número pseudo-aleatório baseado em uma semente (a data)
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Função para gerar jogos simulados para uma data específica
const generateMockGames = (dateStr: string): Game[] => {
  if (!dateStr) return [];

  const dateSeed = new Date(dateStr).getTime();
  const numGames = Math.floor(seededRandom(dateSeed) * 6) + 5; // Entre 5 e 10 jogos
  const games: Game[] = [];
  const usedTeamIds = new Set<string>();

  const availableTeams = [...NBA_TEAMS];

  for (let i = 0; i < numGames; i++) {
    // Garante que não fiquemos sem times
    if (availableTeams.length < 2) break;

    // Seleciona time da casa
    const homeTeamIndex = Math.floor(seededRandom(dateSeed + i * 10) * availableTeams.length);
    const homeTeam = availableTeams.splice(homeTeamIndex, 1)[0];
    usedTeamIds.add(homeTeam.id);

    // Seleciona time visitante
    const awayTeamIndex = Math.floor(seededRandom(dateSeed + i * 20) * availableTeams.length);
    const awayTeam = availableTeams.splice(awayTeamIndex, 1)[0];
    usedTeamIds.add(awayTeam.id);

    const gameHour = Math.floor(seededRandom(dateSeed + i * 30) * 5) + 19; // Jogos entre 19h e 23h
    const gameMinutes = seededRandom(dateSeed + i * 40) > 0.5 ? '30' : '00';
    const timeBrasilia = `${gameHour}:${gameMinutes}`;

    games.push({
      id: `mock-${dateSeed}-${i}`,
      date: new Date(dateStr).toISOString(),
      timeBrasilia,
      status: 'Agendado',
      statusTextPt: 'Agendado',
      gameStatus: 1, // 1 = Agendado
      name: `${awayTeam.name} @ ${homeTeam.name}`,
      arena: `${homeTeam.name} Arena`,
      city: 'Cidade Simulada',
      state: 'ES',
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        tricode: homeTeam.abbreviation,
        logo: `https://cdn.nba.com/logos/nba/${homeTeam.id}/primary/L/logo.svg`,
        score: '',
        wins: 0,
        losses: 0,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        tricode: awayTeam.abbreviation,
        logo: `https://cdn.nba.com/logos/nba/${awayTeam.id}/primary/L/logo.svg`,
        score: '',
        wins: 0,
        losses: 0,
      },
      broadcasters: {
        national: seededRandom(dateSeed + i * 50) > 0.6 ? 'ESPN' : 'League Pass',
        regional: 'N/D',
      },
    });
  }

  return games.sort((a, b) => a.timeBrasilia.localeCompare(b.timeBrasilia));
};

// --- FIM DA LÓGICA DE SIMULAÇÃO ---

interface Game {
  id: string;
  date: string;
  timeBrasilia: string;
  status: string;
  statusTextPt: string;
  gameStatus: number;
  period?: number;
  gameClock?: string;
  name: string;
  arena: string;
  city: string;
  state: string;
  homeTeam: {
    id: string;
    name: string;
    tricode: string;
    logo: string;
    score: string;
    wins: number;
    losses: number;
  };
  awayTeam: {
    id: string;
    name: string;
    tricode: string;
    logo: string;
    score: string;
    wins: number;
    losses: number;
  };
  broadcasters: {
    national: string;
    regional: string;
  };
}

export default function Calendario() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Inicia com a data de hoje
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [mockCalendar, setMockCalendar] = useState<{[key: string]: Game[]}>({});

  // Gera o calendário para o mês inteiro ao carregar ou mudar de mês
  useEffect(() => {
    const { year, month } = getDaysInMonth(currentMonth);
    const newCalendar: {[key: string]: Game[]} = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      newCalendar[dateKey] = generateMockGames(dateKey);
    }
    setMockCalendar(newCalendar);
  }, [currentMonth]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); 

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate('');
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate('');
  };

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;
    setSelectedDate(dateKey);
  };

  const hasGamesOnDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;
    return mockCalendar[dateKey] && mockCalendar[dateKey].length > 0;
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  
  const selectedGames = (selectedDate ? mockCalendar[selectedDate] || [] : []).filter(game => {
    if (!selectedTeam) return true;
    return game.homeTeam.id === selectedTeam || game.awayTeam.id === selectedTeam;
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            📅 Calendário NBA
          </h1>
          <p className="text-lg text-gray-600">
            Jogos, horários e transmissões da temporada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Filtros</h2>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              >
                <option value="">Todos os Times</option>
                {NBA_TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-pink-600 transition"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatMonthYear(currentMonth)}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-pink-600 transition"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hasGames = hasGamesOnDate(day);
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateKey;
                  const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-xl font-semibold transition-all flex items-center justify-center text-lg
                        ${isSelected
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30'
                          : hasGames
                            ? 'bg-pink-500/10 text-pink-700 hover:bg-pink-500/20'
                            : isToday
                              ? 'bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20'
                              : 'text-gray-800 hover:bg-gray-100'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-28">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <Calendar className="w-5 h-5 text-cyan-600" />
                {selectedDate
                  ? `Jogos em ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                    })}`
                  : 'Selecione uma data'}
              </h2>

              {selectedGames.length > 0 ? (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-4">
                          <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-md">
                            {game.timeBrasilia}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{game.arena}</span>
                        </div>
                      </div>
                      <div className="px-6 py-6">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                          <div className="flex items-center gap-3">
                            <img 
                              src={game.awayTeam.logo} 
                              alt={game.awayTeam.tricode} 
                              className="w-12 h-12" 
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-base">{game.awayTeam.tricode}</h3>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-400">@</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 text-right">
                              <h3 className="font-bold text-gray-900 text-base">{game.homeTeam.tricode}</h3>
                            </div>
                            <img 
                              src={game.homeTeam.logo} 
                              alt={game.homeTeam.tricode} 
                              className="w-12 h-12" 
                            />
                          </div>
                        </div>
                      </div>
                      {(game.broadcasters?.national !== 'N/D') && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                          <div className="flex items-center gap-2 text-xs">
                            <Tv className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 font-medium">Transmissão:</span>
                            <span className="text-gray-900 font-bold">
                              {game.broadcasters.national}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Nenhum jogo nesta data</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-medium">Selecione uma data no calendário</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}