import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { NBA_TEAMS } from '@/lib/nbaTeams';

interface Game {
  id: string;
  date: string;
  timeBrasilia: string;
  status: string;
  statusTextPt: string;
  gameStatus: number;
  name: string;
  period?: number;
  gameClock?: string;
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

interface CalendarData {
  [date: string]: Game[];
}

export default function CalendarioNBA() {
  const [calendar, setCalendar] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadCalendar();
    
    // Auto-refresh para jogos ao vivo (a cada 30 segundos)
    const interval = setInterval(() => {
      const hasLiveGames = Object.values(calendar).some(games =>
        games.some(game => game.gameStatus === 2)
      );
      if (hasLiveGames) {
        loadCalendar();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTeam, currentMonth]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      
      const { data, error } = await supabase.functions.invoke('nba-calendar', {
        body: {
          month: `${year}${month}`,
          teamId: selectedTeam || null,
        },
      });
      
      if (error) {
        console.error('[CALENDARIO-NBA] Erro:', error);
        setCalendar({});
        return;
      }
  
      if (data?.success && data?.calendar) {
        setCalendar(data.calendar);
      } else {
        setCalendar({});
      }
    } catch (err) {
      console.error('[CALENDARIO-NBA] Erro:', err);
      setCalendar({});
    } finally {
      setLoading(false);
    }
  };

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
    return calendar[dateKey] && calendar[dateKey].length > 0;
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const selectedGames = selectedDate ? calendar[selectedDate] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">
            🏀 Calendário NBA
          </h1>
          <p className="text-xl text-gray-600">
            Acompanhe todos os jogos, horários e transmissões da temporada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Filtros + Calendário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtro de Times */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtrar por Time
              </h2>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              >
                <option value="">🏀 Todos os Times</option>
                {NBA_TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            {/* Calendário */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              {/* Navegação do Mês */}
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={handlePreviousMonth}
                  className="p-3 rounded-xl text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <h3 className="text-2xl font-black text-gray-900 capitalize">
                  {formatMonthYear(currentMonth)}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="p-3 rounded-xl text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 text-center text-sm font-bold text-gray-500 mb-4">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
                  <div key={day} className="py-3">{day}</div>
                ))}
              </div>

              {/* Grid de Dias */}
              <div className="grid grid-cols-7 gap-2">
                {/* Espaços vazios antes do primeiro dia */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {/* Dias do mês */}
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
                      className={`
                        aspect-square rounded-2xl font-bold transition-all duration-200 
                        flex items-center justify-center text-lg relative overflow-hidden
                        ${isSelected
                          ? 'bg-gradient-to-br from-pink-600 to-purple-600 text-white shadow-2xl shadow-pink-500/50 scale-105'
                          : hasGames
                            ? 'bg-pink-500/15 text-pink-700 hover:bg-pink-500/25 hover:scale-105 shadow-md'
                            : isToday
                              ? 'bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 ring-2 ring-cyan-500'
                              : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                        }
                      `}
                    >
                      <span className="relative z-10">{day}</span>
                      {hasGames && !isSelected && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 bg-pink-600 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Jogos do Dia Selecionado */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 sticky top-28">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Selecione uma data'}
              </h2>

              {/* Loading */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin text-pink-600 mb-4" />
                  <p className="text-gray-600 font-medium">Carregando jogos...</p>
                </div>
              ) : selectedGames.length > 0 ? (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      {/* Header com Status */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          {game.gameStatus === 3 && (
                            <span className="bg-gray-800 text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase">
                              {game.statusTextPt}
                            </span>
                          )}
                          {game.gameStatus === 2 && (
                            <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg animate-pulse flex items-center gap-2 uppercase">
                              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                              {game.statusTextPt}
                            </span>
                          )}
                          {game.gameStatus === 1 && (
                            <span className="bg-cyan-500 text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase">
                              {game.timeBrasilia}
                            </span>
                          )}

                          {/* Período e Relógio */}
                          {game.gameStatus === 2 && game.period && (
                            <span className="text-xs font-bold text-gray-700">
                              {game.period}º Q {game.gameClock && `• ${game.gameClock}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Placar */}
                      <div className="px-5 py-6">
                        <div className="space-y-4">
                          {/* Time Visitante */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <img 
                                src={game.awayTeam.logo} 
                                alt={game.awayTeam.tricode}
                                className="w-12 h-12"
                              />
                              <div className="flex-1">
                                <h3 className="font-black text-gray-900 text-base">{game.awayTeam.tricode}</h3>
                                <p className="text-xs text-gray-500 font-medium">{game.awayTeam.name}</p>
                                {game.awayTeam.wins > 0 && (
                                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                    {game.awayTeam.wins}-{game.awayTeam.losses}
                                  </p>
                                )}
                              </div>
                            </div>
                            {game.awayTeam.score ? (
                              <span className="text-3xl font-black text-gray-900 tabular-nums">
                                {game.awayTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                          </div>

                          {/* Divisor */}
                          <div className="border-t-2 border-gray-200"></div>

                          {/* Time da Casa */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <img 
                                src={game.homeTeam.logo} 
                                alt={game.homeTeam.tricode}
                                className="w-12 h-12"
                              />
                              <div className="flex-1">
                                <h3 className="font-black text-gray-900 text-base">{game.homeTeam.tricode}</h3>
                                <p className="text-xs text-gray-500 font-medium">{game.homeTeam.name}</p>
                                {game.homeTeam.wins > 0 && (
                                  <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                    {game.homeTeam.wins}-{game.homeTeam.losses}
                                  </p>
                                )}
                              </div>
                            </div>
                            {game.homeTeam.score ? (
                              <span className="text-3xl font-black text-gray-900 tabular-nums">
                                {game.homeTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer com Arena e Transmissão */}
                      <div className="px-5 py-4 bg-gray-50 border-t-2 border-gray-200 space-y-2">
                        {/* Arena */}
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold truncate">
                            {game.arena}
                            {game.city !== 'N/D' && ` • ${game.city}, ${game.state}`}
                          </span>
                        </div>

                        {/* Transmissão */}
                        {(game.broadcasters?.national !== 'N/D' || game.broadcasters?.regional !== 'N/D') && (
                          <div className="flex items-start gap-2 text-xs">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <div className="flex-1">
                              {game.broadcasters.national !== 'N/D' && (
                                <p className="text-gray-700 font-bold">{game.broadcasters.national}</p>
                              )}
                              {game.broadcasters.regional !== 'N/D' && (
                                <p className="text-gray-600 font-medium">{game.broadcasters.regional}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-16">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-bold text-lg">Nenhum jogo nesta data</p>
                  <p className="text-gray-400 text-sm mt-2">Selecione outro dia no calendário</p>
                </div>
              ) : (
                <div className="text-center py-16">
                  <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-gray-500 font-bold text-lg">Clique em um dia</p>
                  <p className="text-gray-400 text-sm mt-2">Veja todos os jogos da data selecionada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}