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

// Mapeamento de canais americanos para canais brasileiros/serviços de streaming
const BRAZIL_BROADCAST_MAP: Record<string, string> = {
  'ESPN': 'ESPN 2 / Star+',
  'ABC': 'ESPN / Star+',
  'TNT': 'TNT Sports / HBO Max',
  'NBATV': 'NBA TV',
  'Prime Video': 'Amazon Prime Video',
  'Amazon Prime Video': 'Amazon Prime Video',
  // Adicione mais mapeamentos conforme necessário para canais regionais que transmitem jogos importantes
  // Ex: Se um jogo é transmitido na TNT ou ESPN americana, é provável que seja transmitido no Brasil.
};

/**
 * Tenta mapear o canal americano para o canal brasileiro.
 * Adiciona 'League Pass' a todos os jogos.
 */
const getBrazilBroadcast = (usBroadcast: string | undefined): string => {
  if (!usBroadcast) {
    return 'League Pass';
  }

  // Tenta encontrar uma correspondência direta
  const mappedChannel = BRAZIL_BROADCAST_MAP[usBroadcast];
  if (mappedChannel) {
    return `${mappedChannel}, League Pass`;
  }
  
  // Tenta encontrar correspondência parcial (ex: 'ESPN' dentro de 'ESPN2')
  for (const key in BRAZIL_BROADCAST_MAP) {
    if (usBroadcast.toUpperCase().includes(key.toUpperCase())) {
      return `${BRAZIL_BROADCAST_MAP[key]}, League Pass`;
    }
  }

  // Se não houver mapeamento, assume apenas League Pass
  return 'League Pass';
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
      
      // Pega o primeiro canal de transmissão americano
      const usBroadcast = competition.broadcasts?.[0]?.names?.[0];
      const brazilBroadcast = getBrazilBroadcast(usBroadcast);

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
        canal: brazilBroadcast, // Usando o canal mapeado para o Brasil
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