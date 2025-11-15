import axios from 'axios';

// URL base da API da ESPN (mantida para outras funções)
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

// Interface para definir a estrutura de um jogo
export interface Jogo {
  id: string;
  data: string;
  horario: string;
  timeCasa: {
    id: string;
    nome: string;
    sigla: string;
    logo: string;
    placar?: number;
  };
  timeVisitante: {
    id: string;
    nome: string;
    sigla: string;
    logo: string;
    placar?: number;
  };
  status: 'agendado' | 'aovivo' | 'finalizado';
  canal?: string;
  arena?: string;
}

// Mapeamento manual de jogos Prime Video/ESPN (Exemplo baseado em jogos de destaque)
const PRIME_VIDEO_GAMES: [string, string][] = [
  ['NYK', 'MIA'], // Knicks x Heat
  ['GSW', 'SAS'], // Warriors x Spurs
];

const ESPN_GAMES: [string, string][] = [
  // Adicione jogos ESPN aqui
];

// Helper para verificar se um jogo corresponde a um mapeamento
const isGameMatch = (team1: string, team2: string, list: [string, string][]): boolean => {
  const teams = [team1, team2].sort();
  return list.some(pair => {
    const sortedPair = pair.sort();
    return sortedPair[0] === teams[0] && sortedPair[1] === teams[1];
  });
};

/**
 * Formata o canal de transmissão para o contexto brasileiro.
 * @param jogo O objeto Jogo completo.
 * @returns String formatada com os canais.
 */
export const formatBroadcast = (jogo: Jogo): string => {
  let channels = ['League Pass'];
  const home = jogo.timeCasa.sigla;
  const away = jogo.timeVisitante.sigla;
  const apiChannel = jogo.canal?.toLowerCase();
  
  // 1. Mapeamento manual (Prime Video/ESPN Brasil)
  if (isGameMatch(home, away, PRIME_VIDEO_GAMES)) {
    channels.unshift('Prime Video');
  }
  
  if (isGameMatch(home, away, ESPN_GAMES)) {
    channels.unshift('ESPN');
  }

  // 2. Mapeamento de canais nacionais dos EUA (se não for Prime Video/ESPN)
  if (apiChannel) {
    if (apiChannel.includes('espn') && !channels.includes('ESPN')) {
      channels.unshift('ESPN');
    }
    // Adicione outros canais nacionais aqui se necessário
  }
  
  // Remove duplicatas e junta
  const uniqueChannels = Array.from(new Set(channels));
  
  // Se tiver mais de um, junta com " / "
  return uniqueChannels.join(' / ');
};


const getTodayDateInSaoPaulo = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const [year, month, day] = formatter.format(now).split('-');
  return `${year}-${month}-${day}`;
};

export const buscarJogosPorData = async (data: string): Promise<Jogo[]> => {
  try {
    const dataFormatada = data.replace(/-/g, '');
    const response = await axios.get(`${ESPN_API_BASE}/scoreboard`, {
      params: { dates: dataFormatada },
    });

    if (!response.data.events) return [];

    const jogos = response.data.events.map((event: any) => {
      const competition = event.competitions[0];
      const timeCasa = competition.competitors.find((t: any) => t.homeAway === 'home');
      const timeVisitante = competition.competitors.find((t: any) => t.homeAway === 'away');

      // Tenta encontrar o canal de transmissão nacional
      const nationalBroadcast = competition.broadcasts?.find((b: any) => b.market === 'national');
      const channelName = nationalBroadcast?.names?.[0] || competition.broadcasts?.[0]?.names?.[0];

      return {
        id: event.id,
        data: event.date,
        horario: new Date(event.date).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        }),
        timeCasa: {
          id: timeCasa.id,
          nome: timeCasa.team.displayName,
          sigla: timeCasa.team.abbreviation,
          logo: timeCasa.team.logo,
          placar: timeCasa.score ? parseInt(timeCasa.score) : undefined,
        },
        timeVisitante: {
          id: timeVisitante.id,
          nome: timeVisitante.team.displayName,
          sigla: timeVisitante.team.abbreviation,
          logo: timeVisitante.team.logo,
          placar: timeVisitante.score ? parseInt(timeVisitante.score) : undefined,
        },
        status: competition.status.type.completed
          ? 'finalizado'
          : competition.status.type.state === 'in'
          ? 'aovivo'
          : 'agendado',
        canal: channelName, // Usando o canal extraído
        arena: competition.venue?.fullName,
      };
    });

    return jogos;
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return [];
  }
};

export const buscarJogosHoje = async (): Promise<Jogo[]> => {
  const hoje = getTodayDateInSaoPaulo();
  return buscarJogosPorData(hoje);
};

export const buscarJogosSemana = async (): Promise<Jogo[]> => {
  try {
    const hoje = new Date();
    const jogos: Jogo[] = [];

    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      const dataFormatada = data.toISOString().split('T')[0];
      const jogosDoDia = await buscarJogosPorData(dataFormatada);
      jogos.push(...jogosDoDia);
    }

    return jogos;
  } catch (error) {
    console.error('Erro ao buscar jogos da semana:', error);
    return [];
  }
};