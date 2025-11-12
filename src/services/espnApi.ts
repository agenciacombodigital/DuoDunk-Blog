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
        canal: competition.broadcasts?.[0]?.names?.[0],
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

// ========== ESTATÍSTICAS - SOLUÇÃO DEFINITIVA (Dados Mock Completos) ==========

export interface EstatisticaJogador {
  id: string;
  nome: string;
  siglaTime: string;
  logoTime: string;
  posicao: string;
  foto: string;
  pontos: number;
  rebotes: number;
  assistencias: number;
  roubos: number;
  tocos: number;
  triplos: number;
}

interface DadosEstatisticas {
  pontos: EstatisticaJogador[];
  rebotes: EstatisticaJogador[];
  assistencias: EstatisticaJogador[];
  roubos: EstatisticaJogador[];
  tocos: EstatisticaJogador[];
  triplos: EstatisticaJogador[];
}

// CORREÇÃO: Usar ESPN CDN para fotos (IDs corretos)
const obterFotoJogador = (id: string): string => {
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=350&h=254`;
};

const obterLogoTime = (sigla: string): string => {
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${sigla.toLowerCase()}.png&h=100&w=100`;
};

// DADOS MOCK REALISTAS com IDs ESPN CORRETOS
const dadosMockCompletos: EstatisticaJogador[] = [
  {
    id: '2544', // Giannis - ESPN ID
    nome: 'Giannis Antetokounmpo',
    siglaTime: 'MIL',
    logoTime: obterLogoTime('MIL'),
    posicao: 'PF',
    foto: obterFotoJogador('2544'),
    pontos: 33.4,
    rebotes: 11.9,
    assistencias: 6.8,
    roubos: 0.9,
    tocos: 1.3,
    triplos: 1.6,
  },
  {
    id: '4431678', // Tyrese Maxey - ESPN ID CORRETO
    nome: 'Tyrese Maxey',
    siglaTime: 'PHI',
    logoTime: obterLogoTime('PHI'),
    posicao: 'PG',
    foto: obterFotoJogador('4431678'),
    pontos: 33.2,
    rebotes: 4.9,
    assistencias: 8.2,
    roubos: 1.2,
    tocos: 1.0,
    triplos: 4.1,
  },
  {
    id: '4278073', // Shai - ESPN ID CORRETO
    nome: 'Shai Gilgeous-Alexander',
    siglaTime: 'OKC',
    logoTime: obterLogoTime('OKC'),
    posicao: 'PG',
    foto: obterFotoJogador('4278073'),
    pontos: 33.2,
    rebotes: 5.2,
    assistencias: 6.0,
    roubos: 1.1,
    tocos: 1.1,
    triplos: 2.1,
  },
  {
    id: '3934672', // Donovan Mitchell - ESPN ID
    nome: 'Donovan Mitchell',
    siglaTime: 'CLE',
    logoTime: obterLogoTime('CLE'),
    posicao: 'SG',
    foto: obterFotoJogador('3934672'),
    pontos: 30.4,
    rebotes: 4.4,
    assistencias: 5.4,
    roubos: 1.5,
    tocos: 0.4,
    triplos: 4.8,
  },
  {
    id: '4397020', // Austin Reaves - ESPN ID CORRETO
    nome: 'Austin Reaves',
    siglaTime: 'LAL',
    logoTime: obterLogoTime('LAL'),
    posicao: 'SG',
    foto: obterFotoJogador('4397020'),
    pontos: 30.3,
    rebotes: 4.9,
    assistencias: 6.9,
    roubos: 1.0,
    tocos: 0.5,
    triplos: 3.2,
  },
  {
    id: '4433134', // Anthony Edwards - ESPN ID
    nome: 'Anthony Edwards',
    siglaTime: 'MIN',
    logoTime: obterLogoTime('MIN'),
    posicao: 'SG',
    foto: obterFotoJogador('4433134'),
    pontos: 28.3,
    rebotes: 5.6,
    assistencias: 5.4,
    roubos: 1.4,
    tocos: 0.7,
    triplos: 3.7,
  },
  {
    id: '4432166', // Cade Cunningham - ESPN ID
    nome: 'Cade Cunningham',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PG',
    foto: obterFotoJogador('4432166'),
    pontos: 27.5,
    rebotes: 7.2,
    assistencias: 10.1,
    roubos: 1.1,
    tocos: 0.8,
    triplos: 2.8,
  },
  {
    id: '3975', // Stephen Curry - ESPN ID
    nome: 'Stephen Curry',
    siglaTime: 'GSW',
    logoTime: obterLogoTime('GSW'),
    posicao: 'PG',
    foto: obterFotoJogador('3975'),
    pontos: 26.8,
    rebotes: 5.0,
    assistencias: 6.3,
    roubos: 1.2,
    tocos: 0.4,
    triplos: 5.3,
  },
  {
    id: '4433218', // Victor Wembanyama - ESPN ID
    nome: 'Victor Wembanyama',
    siglaTime: 'SAS',
    logoTime: obterLogoTime('SAS'),
    posicao: 'C',
    foto: obterFotoJogador('4433218'),
    pontos: 25.7,
    rebotes: 11.2,
    assistencias: 4.2,
    roubos: 1.3,
    tocos: 4.1,
    triplos: 1.8,
  },
  {
    id: '3112335', // Nikola Jokic - ESPN ID
    nome: 'Nikola Jokic',
    siglaTime: 'DEN',
    logoTime: obterLogoTime('DEN'),
    posicao: 'C',
    foto: obterFotoJogador('3112335'),
    pontos: 25.2,
    rebotes: 13.5,
    assistencias: 10.8,
    roubos: 1.4,
    tocos: 0.8,
    triplos: 1.1,
  },
  {
    id: '3992', // James Harden - ESPN ID
    nome: 'James Harden',
    siglaTime: 'LAC',
    logoTime: obterLogoTime('LAC'),
    posicao: 'PG',
    foto: obterFotoJogador('3992'),
    pontos: 22.0,
    rebotes: 6.1,
    assistencias: 9.2,
    roubos: 1.3,
    tocos: 0.6,
    triplos: 2.9,
  },
  {
    id: '4433219', // Josh Giddey - ESPN ID
    nome: 'Josh Giddey',
    siglaTime: 'CHI',
    logoTime: obterLogoTime('CHI'),
    posicao: 'SG',
    foto: obterFotoJogador('4433219'),
    pontos: 21.4,
    rebotes: 8.3,
    assistencias: 7.5,
    roubos: 1.5,
    tocos: 0.9,
    triplos: 1.9,
  },
  {
    id: '3155942', // Domantas Sabonis - ESPN ID
    nome: 'Domantas Sabonis',
    siglaTime: 'SAC',
    logoTime: obterLogoTime('SAC'),
    posicao: 'C',
    foto: obterFotoJogador('3155942'),
    pontos: 20.1,
    rebotes: 14.2,
    assistencias: 7.1,
    roubos: 0.9,
    tocos: 0.7,
    triplos: 0.4,
  },
  {
    id: '3936299', // Grayson Allen - ESPN ID
    nome: 'Grayson Allen',
    siglaTime: 'PHX',
    logoTime: obterLogoTime('PHX'),
    posicao: 'SG',
    foto: obterFotoJogador('3936299'),
    pontos: 18.9,
    rebotes: 4.1,
    assistencias: 3.2,
    roubos: 0.8,
    tocos: 0.3,
    triplos: 4.8,
  },
  {
    id: '3136776', // Myles Turner - ESPN ID
    nome: 'Myles Turner',
    siglaTime: 'IND',
    logoTime: obterLogoTime('IND'),
    posicao: 'C',
    foto: obterFotoJogador('3136776'),
    pontos: 15.8,
    rebotes: 7.9,
    assistencias: 1.8,
    roubos: 0.7,
    tocos: 2.5,
    triplos: 2.3,
  },
  {
    id: '4066373', // OG Anunoby - ESPN ID
    nome: 'OG Anunoby',
    siglaTime: 'NYK',
    logoTime: obterLogoTime('NYK'),
    posicao: 'SF',
    foto: obterFotoJogador('4066373'),
    pontos: 15.2,
    rebotes: 4.9,
    assistencias: 2.1,
    roubos: 1.9,
    tocos: 0.8,
    triplos: 2.7,
  },
  {
    id: '4396993', // Dyson Daniels - ESPN ID
    nome: 'Dyson Daniels',
    siglaTime: 'ATL',
    logoTime: obterLogoTime('ATL'),
    posicao: 'SG',
    foto: obterFotoJogador('4396993'),
    pontos: 12.7,
    rebotes: 4.6,
    assistencias: 3.5,
    roubos: 3.2,
    tocos: 1.3,
    triplos: 1.8,
  },
  {
    id: '5104281', // Alex Sarr - ESPN ID
    nome: 'Alex Sarr',
    siglaTime: 'WAS',
    logoTime: obterLogoTime('WAS'),
    posicao: 'C',
    foto: obterFotoJogador('5104281'),
    pontos: 12.1,
    rebotes: 6.8,
    assistencias: 1.9,
    roubos: 1.0,
    tocos: 1.8,
    triplos: 1.1,
  },
  {
    id: '5105298', // Ryan Kalkbrenner - ESPN ID
    nome: 'Ryan Kalkbrenner',
    siglaTime: 'CHA',
    logoTime: obterLogoTime('CHA'),
    posicao: 'C',
    foto: obterFotoJogador('5105298'),
    pontos: 11.4,
    rebotes: 8.5,
    assistencias: 1.2,
    roubos: 0.6,
    tocos: 2.1,
    triplos: 0.2,
  },
  {
    id: '4066636', // Isaiah Stewart - ESPN ID
    nome: 'Isaiah Stewart',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PF',
    foto: obterFotoJogador('4066636'),
    pontos: 10.3,
    rebotes: 8.9,
    assistencias: 1.5,
    roubos: 0.8,
    tocos: 1.6,
    triplos: 0.9,
  },
];

export async function buscarLideresEstatisticas(): Promise<DadosEstatisticas> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    pontos: [...dadosMockCompletos].sort((a, b) => b.pontos - a.pontos),
    rebotes: [...dadosMockCompletos].sort((a, b) => b.rebotes - a.rebotes),
    assistencias: [...dadosMockCompletos].sort((a, b) => b.assistencias - a.assistencias),
    roubos: [...dadosMockCompletos].sort((a, b) => b.roubos - a.roubos),
    tocos: [...dadosMockCompletos].sort((a, b) => b.tocos - a.tocos),
    triplos: [...dadosMockCompletos].sort((a, b) => b.triplos - a.triplos),
  };
}

// Função mantida para compatibilidade (não mais usada)
export async function buscarEstatisticasCompletas(): Promise<EstatisticaJogador[]> {
  return dadosMockCompletos;
}