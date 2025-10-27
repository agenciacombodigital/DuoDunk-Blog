import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Tv, ChevronLeft, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { NBA_TEAMS } from '@/lib/nbaTeams';

interface Game {
  id: string;
  date: string;
  timeBrasilia: string;
  status: string;
  name: string;
  homeTeam: {
    id: string;
    name: string;
    logo: string;
    score: string;
  };
  awayTeam: {
    id: string;
    name: string;
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

  // Helper to format month/year for API call (YYYYMM)
  const getApiMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}${month}`;
  };

  useEffect(() => {
    loadCalendar();
  }, [selectedTeam, currentMonth]); // Depend on currentMonth too

  const loadCalendar = async () => {
    try {
      setLoading(true);
      console.log('[CALENDARIO] Buscando jogos...', { selectedTeam });
      
      // Montar body da requisição
      const body: any = {};
      
      // Adicionar filtro de time se selecionado
      if (selectedTeam && selectedTeam !== '') {
        body.teamId = selectedTeam;
        console.log('[CALENDARIO] Filtrando por time:', selectedTeam);
      }
      
      // Adicionar mês atual (formato YYYYMM)
      body.month = getApiMonth(currentMonth);
      console.log('[CALENDARIO] Buscando mês:', body.month);

      const { data, error } = await supabase.functions.invoke('nba-calendar', {
        body
      });
      
      if (error) {
        console.error('[CALENDARIO] Erro na requisição:', error);
        throw error;
      }
      
      console.log('[CALENDARIO] Resposta recebida:', data);
      
      if (data?.success && data?.calendar) {
        const totalDays = Object.keys(data.calendar).length;
        console.log('[CALENDARIO] ✅ Jogos encontrados:', totalDays, 'dias');
        
        setCalendar(data.calendar);
      } else {
        console.warn('[CALENDARIO] Resposta sem dados:', data);
        setCalendar({});
      }
    } catch (err) {
      console.error('[CALENDARIO] Erro ao buscar calendário:', err);
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
    // getDay() returns 0 for Sunday, 1 for Monday...
    const startingDayOfWeek = firstDay.getDay(); 

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(''); // Clear selected date on month change
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(''); // Clear selected date on month change
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
    
    const hasGames = calendar[dateKey] && calendar[dateKey].length > 0;
    
    // Debug apenas para os primeiros 3 dias
    if (day <= 3) {
      console.log(`[CALENDARIO] Dia ${day} (${dateKey}):`, hasGames ? `${calendar[dateKey].length} jogos` : 'sem jogos');
    }
    
    return hasGames;
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  const selectedGames = selectedDate ? calendar[selectedDate] || [] : [];

  return (
    <div className="min-h-screen bg-white text-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            📅 Calendário NBA
          </h1>
          <p className="text-lg text-gray-600">
            Jogos, horários e transmissões da temporada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Filtros e Calendário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtro de Times */}
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

            {/* Calendário */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              {/* Header do Calendário */}
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

              {/* Dias da semana */}
              <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
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

          {/* Lista de Jogos do Dia Selecionado */}
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
                    <div key={game.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-md">
                      {/* Times */}
                      <div className="flex items-center justify-between text-lg font-bold mb-3">
                        {/* Away Team */}
                        <div className="flex items-center gap-2">
                          <img
                            src={game.awayTeam.logo}
                            alt={game.awayTeam.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48?text=?';
                            }}
                          />
                          <div className="text-left">
                            <span className="text-gray-900 block text-sm">{game.awayTeam.name}</span>
                            {game.awayTeam.score && (
                              <span className="text-xl font-black text-gray-900">{game.awayTeam.score}</span>
                            )}
                          </div>
                        </div>
                        
                        <span className="text-gray-500 text-sm font-bold">@</span>
                        
                        {/* Home Team */}
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <img
                            src={game.homeTeam.logo}
                            alt={game.homeTeam.name}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48?text=?';
                            }}
                          />
                          <div className="text-right">
                            <span className="text-gray-900 block text-sm">{game.homeTeam.name}</span>
                            {game.homeTeam.score && (
                              <span className="text-xl font-black text-gray-900">{game.homeTeam.score}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Horário e Status */}
                      <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-3 mt-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{game.timeBrasilia}</span>
                        </div>
                        <span className={`font-bold ${game.status.includes('Final') ? 'text-green-600' : 'text-pink-600'}`}>
                          {game.status}
                        </span>
                      </div>

                      {/* Transmissão */}
                      {game.whereToWatch && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <Tv className="w-3 h-3" />
                          <span>{game.whereToWatch}</span>
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