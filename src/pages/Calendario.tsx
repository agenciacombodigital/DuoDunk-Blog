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
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{game.arena}</span>
                          {game.city !== 'N/D' && <span>• {game.city}, {game.state}</span>}
                        </div>
                      </div>

                      {/* Placar Principal */}
                      <div className="px-6 py-6">
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
                          {/* Time Visitante */}
                          <div className="flex items-center gap-4">
                            <img 
                              src={game.awayTeam.logo} 
                              alt={game.awayTeam.tricode} 
                              className="w-16 h-16" 
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-lg">{game.awayTeam.tricode}</h3>
                              <p className="text-sm text-gray-500">{game.awayTeam.name}</p>
                              {game.awayTeam.wins > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {game.awayTeam.wins}-{game.awayTeam.losses}
                                </p>
                              )}
                            </div>
                            {game.awayTeam.score ? (
                              <span className="text-4xl font-black text-gray-900 tabular-nums">
                                {game.awayTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                          </div>

                          {/* VS/@ */}
                          <div className="flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-400">@</span>
                          </div>

                          {/* Time da Casa */}
                          <div className="flex items-center gap-4">
                            {game.homeTeam.score ? (
                              <span className="text-4xl font-black text-gray-900 tabular-nums">
                                {game.homeTeam.score}
                              </span>
                            ) : (
                              <span className="text-2xl font-bold text-gray-300">-</span>
                            )}
                            <div className="flex-1 text-right">
                              <h3 className="font-bold text-gray-900 text-lg">{game.homeTeam.tricode}</h3>
                              <p className="text-sm text-gray-500">{game.homeTeam.name}</p>
                              {game.homeTeam.wins > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {game.homeTeam.wins}-{game.homeTeam.losses}
                                </p>
                              )}
                            </div>
                            <img 
                              src={game.homeTeam.logo} 
                              alt={game.homeTeam.tricode} 
                              className="w-16 h-16" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer com Transmissão e Ações */}
                      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                        {/* Transmissão */}
                        <div className="flex flex-col gap-1">
                          {game.broadcasters?.national !== 'N/D' && (
                            <div className="flex items-center gap-2 text-xs">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-600 font-medium">Nacional:</span>
                              <span className="text-gray-900 font-bold">{game.broadcasters.national}</span>
                            </div>
                          )}
                          {game.broadcasters?.regional !== 'N/D' && (
                            <div className="flex items-center gap-2 text-xs">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-gray-600 font-medium">Regional:</span>
                              <span className="text-gray-900 font-bold">{game.broadcasters.regional}</span>
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-3">
                          {game.gameStatus === 2 && (
                            <button className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              ASSISTIR AO VIVO
                            </button>
                          )}
                          
                          {(game.gameStatus === 2 || game.gameStatus === 3) && (
                            <button className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                              ESTATÍSTICAS
                            </button>
                          )}

                          {game.gameStatus === 1 && (
                            <button className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                              PREVIEW
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Nenhum jogo nesta data</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
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