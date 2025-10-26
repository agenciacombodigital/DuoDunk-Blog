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
  const [teamId, setTeamId] = useState<string>('all');
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);

  const apiMonth = useMemo(() => format(currentMonth, 'yyyyMM'), [currentMonth]);

  useEffect(() => {
    getCalendar();
  }, [apiMonth, teamId]);

  async function getCalendar() {
    setLoading(true);
    try {
      const teamFilter = teamId === 'all' ? null : teamId; 
      
      const { data, error } = await supabase.functions.invoke('nba-calendar', {
        body: { month: apiMonth, teamId: teamFilter },
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
      const dayData = calendarData[dateKey];
      return !!dayData && dayData.games && dayData.games.length > 0;
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
      // Card de jogo em modo claro
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-700">{game.time} BRT</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isLive ? 'bg-red-600 text-white animate-pulse' : 
            isFinal ? 'bg-green-600 text-white' : 
            'bg-gray-200 text-gray-700'
          }`}>
            {game.status}
          </span>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex items-center gap-3">
            <img src={awayLogo} alt={game.awayTeam.abbreviation} className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-900 text-lg">{game.awayTeam.abbreviation}</span>
          </div>

          {/* Score / VS */}
          <div className="text-center">
            {game.score ? (
              <span className="text-2xl font-black text-pink-600">
                {game.score.away} - {game.score.home}
              </span>
            ) : (
              <span className="text-lg font-bold text-gray-500">VS</span>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">{game.homeTeam.abbreviation}</span>
            <img src={homeLogo} alt={game.homeTeam.abbreviation} className="w-8 h-8 object-contain" />
          </div>
        </div>

        {/* Broadcast Info */}
        {game.broadcast && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-600">
            <Tv className="w-3 h-3" />
            <span>{game.broadcast}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    // Fundo principal branco
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
          {/* Coluna Esquerda: Calendário e Filtros */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtros - Fundo branco */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Filtros</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filtro por Time - Ajustando cores do Select */}
                <Select onValueChange={handleTeamChange} value={teamId}>
                  <SelectTrigger className="w-full bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100">
                    <SelectValue placeholder="Filtrar por Time (Opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300 text-gray-900">
                    <SelectItem value="all">Todos os Times</SelectItem>
                    {NBA_TEAMS.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendário - Fundo branco */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="ghost" 
                  onClick={handlePreviousMonth}
                  className="text-gray-600 hover:text-pink-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-xl font-bold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={handleNextMonth}
                  className="text-gray-600 hover:text-pink-600"
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
                    day_today: "bg-cyan-600/20 text-cyan-800 border border-cyan-600", // Ajuste para light mode
                    day_outside: "text-gray-400 opacity-50",
                    day_hidden: "invisible",
                    day: "text-gray-900 hover:bg-gray-100 rounded-full", // Ajuste para light mode
                    caption_label: "text-gray-900 font-bold", // Ajuste para light mode
                    nav_button: "text-gray-600 hover:text-gray-900", // Ajuste para light mode
                    head_cell: "text-gray-600 font-semibold", // Ajuste para light mode
                    row: "flex w-full mt-2",
                    weeknumber: "text-gray-600",
                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
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
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-28">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <CalendarIcon className="w-5 h-5 text-cyan-600" />
                Jogos em {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Nenhum dia selecionado'}
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
                  <p className="text-gray-600 mt-3">Buscando jogos...</p>
                </div>
              ) : gamesForSelectedDay.length > 0 ? (
                <div className="space-y-4">
                  {gamesForSelectedDay.map((game, index) => (
                    <GameCard key={index} game={game} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-100 rounded-lg border border-gray-200">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhum jogo agendado para este dia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}