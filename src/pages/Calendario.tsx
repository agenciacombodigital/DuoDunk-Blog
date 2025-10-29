import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Tv, ChevronLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react';
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

export default function Calendario() {
  const [calendar, setCalendar] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadCalendar = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      
      const { data, error } = await supabase.functions.invoke('nba-calendar', {
        body: {
          month: `${year}${month}`,
          teamId: selectedTeam || null,
        },
      });
      
      if (error) {
        console.error('[CALENDARIO] Erro:', error);
        setCalendar({});
        return;
      }
  
      if (data?.success && data?.calendar) {
        setCalendar(data.calendar);
      } else {
        setCalendar({});
      }
    } catch (err) {
      console.error('[CALENDARIO] Erro:', err);
      setCalendar({});
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  // Efeito para carregar dados quando o time ou mês muda
  useEffect(() => {
    loadCalendar(false);
  }, [selectedTeam, currentMonth]);

  // Efeito para auto-refresh
  useEffect(() => {
    const hasLiveGames = Object.values(calendar).flat().some(game => game.gameStatus === 2);
    const intervalDuration = hasLiveGames ? 5000 : 60000; // 5s para ao vivo, 1min para outros

    const interval = setInterval(() => {
      loadCalendar(true); // Refresh em segundo plano
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [calendar]); // Dependência no estado do calendário para reavaliar o intervalo

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

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                  <p className="text-gray-600 mt-3">Carregando...</p>
                </div>
              ) : selectedGames.length > 0 ? (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      {/* Header com Status */}
                      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-4">
                          {/* Status Badge */}
                          {game.gameStatus === 3 && (
                            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-md">
                              {game.statusTextPt}
                            </span>
                          )}
                          {game.gameStatus === 2 && (
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md animate-pulse flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                              {game.statusTextPt}
                            </span>
                          )}
                          {game.gameStatus === 1 && (
                            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-md">
                              {game.timeBrasilia}
                            </span>
                          )}

                          {/* Período e Relógio (se ao vivo) */}
                          {game.gameStatus === 2 && game.period && (
                            <span className="text-xs font-medium text-gray-600">
                              {game.period}º Quarto {game.gameClock && `• ${game.gameClock}`}
                            </span>
                          )}
                        </div>

                        {/* Arena */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{game.arena}</span>
                        </div>
                      </div>

                      {/* Placar Principal */}
                      <div className="px-6 py-6">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                          {/* Time Visitante */}
                          <div className="flex items-center gap-3">
                            <img 
                              src={game.awayTeam.logo} 
                              alt={game.awayTeam.tricode} 
                              className="w-12 h-12" 
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-base">{game.awayTeam.tricode}</h3>
                              <p className="text-xs text-gray-500">{game.awayTeam.name}</p>
                            </div>
                            {game.awayTeam.score ? (
                              <span className="text-3xl font-black text-gray-900 tabular-nums">
                                {game.awayTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                          </div>

                          {/* VS/@ */}
                          <div className="flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-400">@</span>
                          </div>

                          {/* Time da Casa */}
                          <div className="flex items-center gap-3">
                            {game.homeTeam.score ? (
                              <span className="text-3xl font-black text-gray-900 tabular-nums">
                                {game.homeTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                            <div className="flex-1 text-right">
                              <h3 className="font-bold text-gray-900 text-base">{game.homeTeam.tricode}</h3>
                              <p className="text-xs text-gray-500">{game.homeTeam.name}</p>
                            </div>
                            <img 
                              src={game.homeTeam.logo} 
                              alt={game.homeTeam.tricode} 
                              className="w-12 h-12" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer com Transmissão */}
                      {(game.broadcasters?.national !== 'N/D' || game.broadcasters?.regional !== 'N/D') && (
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                          <div className="flex items-center gap-2 text-xs">
                            <Tv className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 font-medium">Transmissão:</span>
                            <span className="text-gray-900 font-bold">
                              {game.broadcasters.national !== 'N/D' ? game.broadcasters.national : game.broadcasters.regional}
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