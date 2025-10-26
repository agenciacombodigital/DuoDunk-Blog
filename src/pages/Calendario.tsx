import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addMonths, subMonths, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Tv, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NBA_TEAMS } from '@/lib/nbaTeams';
import { Calendar } from '@/components/ui/calendar';

interface GameEvent {
  id: string;
  date: string; // ISO string
  time: string; // HH:MM
  status: string; // Ex: 'Final', '7:30 PM ET'
  broadcast: string;
  homeTeam: {
    id: string;
    abbreviation: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    abbreviation: string;
    logo: string;
  };
  score?: {
    home: string;
    away: string;
  };
}

interface CalendarDay {
  date: string; // YYYY-MM-DD
  games: GameEvent[];
}

interface CalendarData {
  [key: string]: CalendarDay; // Key is YYYY-MM-DD
}

export default function Calendario() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [teamId, setTeamId] = useState<string>('');
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);

  const apiMonth = useMemo(() => format(currentMonth, 'yyyyMM'), [currentMonth]);

  useEffect(() => {
    getCalendar();
  }, [apiMonth, teamId]);

  async function getCalendar() {
    setLoading(true);
    try {
      // NOTE: Assuming 'nba-calendar' Edge Function exists and returns CalendarData
      const { data, error } = await supabase.functions.invoke('nba-calendar', {
        body: { month: apiMonth, teamId },
      });

      if (error) throw error;
      
      if (data?.success && data?.calendar) {
        setCalendarData(data.calendar);
      } else {
        setCalendarData({});
      }
    } catch (error) {
      console.error('Erro ao buscar calendário:', error);
      setCalendarData({});
    } finally {
      setLoading(false);
    }
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(undefined);
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(undefined);
  };

  const handleTeamChange = (value: string) => {
    setTeamId(value);
    setSelectedDate(undefined);
  };

  const selectedDayKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const gamesForSelectedDay = calendarData[selectedDayKey]?.games || [];

  const modifiers = {
    hasGames: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return !!calendarData[dateKey] && calendarData[dateKey].games.length > 0;
    },
  };

  const modifiersStyles = {
    hasGames: {
      fontWeight: 'bold',
      color: '#FA007D', // Primary color
      backgroundColor: '#FA007D1A', // Light background for games
      borderRadius: '50%',
    },
  };

  const GameCard = ({ game }: { game: GameEvent }) => {
    const isLive = game.status.toLowerCase().includes('q') || game.status.toLowerCase().includes('half');
    const isFinal = game.status.toLowerCase().includes('final');
    
    // Fallback logos
    const homeLogo = game.homeTeam.logo || `https://cdn.nba.com/logos/nba/${game.homeTeam.id}/primary/L/logo.svg`;
    const awayLogo = game.awayTeam.logo || `https://cdn.nba.com/logos/nba/${game.awayTeam.id}/primary/L/logo.svg`;

    return (
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300">{game.time} BRT</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isLive ? 'bg-red-600 text-white animate-pulse' : 
            isFinal ? 'bg-green-600 text-white' : 
            'bg-gray-600 text-gray-300'
          }`}>
            {game.status}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <img src={awayLogo} alt={game.awayTeam.abbreviation} className="w-8 h-8 object-contain" />
            <span className="font-bold text-white text-lg">{game.awayTeam.abbreviation}</span>
          </div>

          {/* Score / VS */}
          <div className="text-center">
            {game.score ? (
              <span className="text-2xl font-black text-pink-400">
                {game.score.away} - {game.score.home}
              </span>
            ) : (
              <span className="text-lg font-bold text-gray-500">VS</span>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-lg">{game.homeTeam.abbreviation}</span>
            <img src={homeLogo} alt={game.homeTeam.abbreviation} className="w-8 h-8 object-contain" />
          </div>
        </div>

        {/* Broadcast Info */}
        {game.broadcast && (
          <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-400">
            <Tv className="w-3 h-3" />
            <span>{game.broadcast}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-2">
            📅 Calendário NBA
          </h1>
          <p className="text-lg text-gray-400">
            Jogos, horários e transmissões da temporada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda: Calendário e Filtros */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtros */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Filtros</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filtro por Time */}
                <Select onValueChange={handleTeamChange} value={teamId}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                    <SelectValue placeholder="Filtrar por Time (Opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="">Todos os Times</SelectItem>
                    {NBA_TEAMS.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendário */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="ghost" 
                  onClick={handlePreviousMonth}
                  className="text-gray-400 hover:text-pink-500"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-xl font-bold text-white">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={handleNextMonth}
                  className="text-gray-400 hover:text-pink-500"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  locale={ptBR}
                  className="p-0"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  classNames={{
                    day_selected: "bg-pink-600 text-white hover:bg-pink-700 hover:text-white focus:bg-pink-600 focus:text-white",
                    day_today: "bg-cyan-600/20 text-cyan-400 border border-cyan-600",
                    day_outside: "text-gray-600 opacity-50",
                    day_hidden: "invisible",
                    day: "text-white hover:bg-gray-700 rounded-full",
                    caption_label: "text-white font-bold",
                    nav_button: "text-gray-400 hover:text-white",
                    head_cell: "text-gray-400 font-semibold",
                    row: "flex w-full mt-2",
                    weeknumber: "text-gray-400",
                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_dropdowns: "flex gap-1",
                    vhidden: "hidden",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Coluna Direita: Jogos do Dia */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl sticky top-28">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                Jogos em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Nenhum dia selecionado'}
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  <p className="text-gray-400 mt-3">Buscando jogos...</p>
                </div>
              ) : gamesForSelectedDay.length > 0 ? (
                <div className="space-y-4">
                  {gamesForSelectedDay.map((game, index) => (
                    <GameCard key={index} game={game} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                  <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum jogo agendado para este dia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}