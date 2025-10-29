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
  homeTeam: {
    id: string;
    name: string;
    tricode: string;
    logo: string;
    score: string;
  };
  awayTeam: {
    id: string;
    name: string;
    tricode: string;
    logo: string;
    score: string;
  };
  whereToWatch: string;
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

  useEffect(() => {
    loadCalendar();
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
                <div className="space-y-4">
                  {selectedGames.map((game) => (
                    <div key={game.id} className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white rounded-2xl p-6 border border-gray-700 shadow-2xl shadow-pink-500/10 overflow-hidden transition-all hover:border-pink-500/50 hover:scale-[1.02]">
                      {game.gameStatus === 2 && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                          AO VIVO
                        </div>
                      )}
                      {game.gameStatus === 3 && (
                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          FINAL
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-left flex-1">
                          <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" />
                          <div>
                            <p className="text-lg md:text-xl font-black">{game.awayTeam.tricode}</p>
                            <p className="text-xs text-gray-400 hidden md:block">{game.awayTeam.name}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          {game.awayTeam.score && game.homeTeam.score ? (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-black tabular-nums">{game.awayTeam.score}</span>
                              <span className="text-lg text-gray-500 font-light">×</span>
                              <span className="text-2xl font-black tabular-nums">{game.homeTeam.score}</span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-gray-600">VS</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-right flex-1 justify-end">
                          <div>
                            <p className="text-lg md:text-xl font-black">{game.homeTeam.tricode}</p>
                            <p className="text-xs text-gray-400 hidden md:block">{game.homeTeam.name}</p>
                          </div>
                          <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" />
                        </div>
                      </div>
                      <div className="border-t border-gray-700/50 mt-4 pt-3 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{game.timeBrasilia}</span>
                        </div>
                        <span className="font-bold text-gray-300">{game.statusTextPt}</span>
                        {game.whereToWatch && game.whereToWatch !== 'N/D' && (
                          <div className="flex items-center gap-2">
                            <Tv className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{game.whereToWatch}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-10 bg-gray-100 rounded-lg border border-gray-200">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum jogo nesta data</p>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-100 rounded-lg border border-gray-200">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Selecione uma data no calendário</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}