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
                    <div
                      key={game.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Badge de Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-600">{game.timeBrasilia}</span>
                        </div>
                        
                        {game.gameStatus === 2 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                            AO VIVO
                          </span>
                        )}
                        
                        {game.gameStatus === 3 && (
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            FINAL
                          </span>
                        )}
                        
                        {game.gameStatus === 1 && (
                          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                            AGENDADO
                          </span>
                        )}
                      </div>

                      {/* Placar */}
                      <div className="space-y-4">
                        {/* Time Visitante */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <img 
                              src={game.awayTeam.logo} 
                              alt={game.awayTeam.tricode} 
                              className="w-10 h-10" 
                            />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm">{game.awayTeam.tricode}</p>
                              <p className="text-xs text-gray-500">{game.awayTeam.name}</p>
                            </div>
                          </div>
                          
                          {game.awayTeam.score ? (
                            <span className="text-3xl font-black text-gray-900 tabular-nums">
                              {game.awayTeam.score}
                            </span>
                          ) : (
                            <span className="text-lg font-bold text-gray-300">-</span>
                          )}
                        </div>

                        {/* Separador */}
                        <div className="border-t border-gray-100"></div>

                        {/* Time da Casa */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <img 
                              src={game.homeTeam.logo} 
                              alt={game.homeTeam.tricode} 
                              className="w-10 h-10" 
                            />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm">{game.homeTeam.tricode}</p>
                              <p className="text-xs text-gray-500">{game.homeTeam.name}</p>
                            </div>
                          </div>
                          
                          {game.homeTeam.score ? (
                            <span className="text-3xl font-black text-gray-900 tabular-nums">
                              {game.homeTeam.score}
                            </span>
                          ) : (
                            <span className="text-lg font-bold text-gray-300">-</span>
                          )}
                        </div>
                      </div>

                      {/* Período/Relógio (se ao vivo) */}
                      {game.gameStatus === 2 && game.period && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-center text-gray-600 font-medium">
                            {game.period}º Quarto {game.gameClock && `• ${game.gameClock}`}
                          </p>
                        </div>
                      )}

                      {/* Onde Assistir */}
                      {game.whereToWatch && game.whereToWatch !== 'N/D' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-600">{game.whereToWatch}</p>
                        </div>
                      )}
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