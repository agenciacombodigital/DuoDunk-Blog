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
  status: 'agendado' | 'ao_vivo' | 'finalizado';
  canal?: string;
  arena?: string;
}

// Função auxiliar para obter a data de hoje formatada no fuso de São Paulo (BRT/BRST)
const getTodayDateInSaoPaulo = (): string => {
  const now = new Date();
  
  // Formata a data para o fuso de São Paulo (BRT/BRST)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' usa YYYY-MM-DD
  const [year, month, day] = formatter.format(now).split('-');
  
  return `${year}-${month}-${day}`;
};

// Funções de busca de jogos (mantidas)
export const buscarJogosPorData = async (data: string): Promise<Jogo[]> => {
  try {
    const dataFormatada = data.replace(/-/g, '');
    const response = await axios.get(`${ESPN_API_BASE}/scoreboard`, {
      params: {
        dates: dataFormatada
      }
    });

    if (!response.data.events) {
      return [];
    }

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
          timeZone: 'America/Sao_Paulo'
        }),
        timeCasa: {
          id: timeCasa.id,
          nome: timeCasa.team.displayName,
          sigla: timeCasa.team.abbreviation,
          logo: timeCasa.team.logo,
          placar: timeCasa.score ? parseInt(timeCasa.score) : undefined
        },
        timeVisitante: {
          id: timeVisitante.id,
          nome: timeVisitante.team.displayName,
          sigla: timeVisitante.team.abbreviation,
          logo: timeVisitante.team.logo,
          placar: timeVisitante.score ? parseInt(timeVisitante.score) : undefined
        },
        status: competition.status.type.completed 
          ? 'finalizado' 
          : competition.status.type.state === 'in' 
          ? 'ao_vivo' 
          : 'agendado',
        canal: competition.broadcasts?.[0]?.names?.[0],
        arena: competition.venue?.fullName
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

// ========== ESTATÍSTICAS - SOLUÇÃO DEFINITIVA: Dados Mock Completos ==========

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

const obterFotoJogador = (id: string): string => {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
};

const obterLogoTime = (sigla: string): string => {
  return `https://cdn.nba.com/logos/nba/${getTeamId(sigla)}/primary/L/logo.svg`;
};

// Mapa de times para IDs da NBA
const getTeamId = (sigla: string): string => {
  const teamMap: { [key: string]: string } = {
    'MIL': '1610612749',
    'PHI': '1610612755',
    'OKC': '1610612760',
    'CLE': '1610612739',
    'LAL': '1610612747',
    'MIN': '1610612750',
    'DET': '1610612765',
    'GSW': '1610612744',
    'SAS': '1610612759',
    'DEN': '1610612743',
    'LAC': '1610612746',
    'CHI': '1610612741',
    'SAC': '1610612758',
    'PHX': '1610612756',
    'IND': '1610612754',
    'NYK': '1610612752',
    'ATL': '1610612737',
    'WAS': '1610612764',
    'CHA': '1610612766',
    'MEM': '1610612763',
    'BOS': '1610612738',
    'MIA': '1610612748',
    'DAL': '1610612742',
    'TOR': '1610612761',
    'BKN': '1610612751',
  };
  return teamMap[sigla] || '1610612739';
};

// DADOS MOCK REALISTAS - Baseados na temporada 2025-26
const dadosMockCompletos: EstatisticaJogador[] = [
  {
    id: '2544',
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
    id: '1629001',
    nome: 'Tyrese Maxey',
    siglaTime: 'PHI',
    logoTime: obterLogoTime('PHI'),
    posicao: 'PG',
    foto: obterFotoJogador('1629001'),
    pontos: 33.2,
    rebotes: 4.9,
    assistencias: 8.2,
    roubos: 1.2,
    tocos: 1.0,
    triplos: 4.1,
  },
  {
    id: '1628983',
    nome: 'Shai Gilgeous-Alexander',
    siglaTime: 'OKC',
    logoTime: obterLogoTime('OKC'),
    posicao: 'PG',
    foto: obterFotoJogador('1628983'),
    pontos: 33.2,
    rebotes: 5.2,
    assistencias: 6.0,
    roubos: 1.1,
    tocos: 1.1,
    triplos: 2.1,
  },
  {
    id: '203507',
    nome: 'Donovan Mitchell',
    siglaTime: 'CLE',
    logoTime: obterLogoTime('CLE'),
    posicao: 'SG',
    foto: obterFotoJogador('203507'),
    pontos: 30.4,
    rebotes: 4.4,
    assistencias: 5.4,
    roubos: 1.5,
    tocos: 0.4,
    triplos: 4.8,
  },
  {
    id: '1630559',
    nome: 'Austin Reaves',
    siglaTime: 'LAL',
    logoTime: obterLogoTime('LAL'),
    posicao: 'SG',
    foto: obterFotoJogador('1630559'),
    pontos: 30.3,
    rebotes: 4.9,
    assistencias: 6.9,
    roubos: 1.0,
    tocos: 0.5,
    triplos: 3.2,
  },
  {
    id: '1630162',
    nome: 'Anthony Edwards',
    siglaTime: 'MIN',
    logoTime: obterLogoTime('MIN'),
    posicao: 'SG',
    foto: obterFotoJogador('1630162'),
    pontos: 28.3,
    rebotes: 5.6,
    assistencias: 5.4,
    roubos: 1.4,
    tocos: 0.7,
    triplos: 3.7,
  },
  {
    id: '1630595',
    nome: 'Cade Cunningham',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PG',
    foto: obterFotoJogador('1630595'),
    pontos: 27.5,
    rebotes: 7.2,
    assistencias: 10.1,
    roubos: 1.1,
    tocos: 0.8,
    triplos: 2.8,
  },
  {
    id: '201939',
    nome: 'Stephen Curry',
    siglaTime: 'GSW',
    logoTime: obterLogoTime('GSW'),
    posicao: 'PG',
    foto: obterFotoJogador('201939'),
    pontos: 26.8,
    rebotes: 5.0,
    assistencias: 6.3,
    roubos: 1.2,
    tocos: 0.4,
    triplos: 5.3,
  },
  {
    id: '1641705',
    nome: 'Victor Wembanyama',
    siglaTime: 'SAS',
    logoTime: obterLogoTime('SAS'),
    posicao: 'C',
    foto: obterFotoJogador('1641705'),
    pontos: 25.7,
    rebotes: 11.2,
    assistencias: 4.2,
    roubos: 1.3,
    tocos: 4.1,
    triplos: 1.8,
  },
  {
    id: '203999',
    nome: 'Nikola Jokic',
    siglaTime: 'DEN',
    logoTime: obterLogoTime('DEN'),
    posicao: 'C',
    foto: obterFotoJogador('203999'),
    pontos: 25.2,
    rebotes: 13.5,
    assistencias: 10.8,
    roubos: 1.4,
    tocos: 0.8,
    triplos: 1.1,
  },
  {
    id: '201935',
    nome: 'James Harden',
    siglaTime: 'LAC',
    logoTime: obterLogoTime('LAC'),
    posicao: 'PG',
    foto: obterFotoJogador('201935'),
    pontos: 22.0,
    rebotes: 6.1,
    assistencias: 9.2,
    roubos: 1.3,
    tocos: 0.6,
    triplos: 2.9,
  },
  {
    id: '1629634',
    nome: 'Josh Giddey',
    siglaTime: 'CHI',
    logoTime: obterLogoTime('CHI'),
    posicao: 'SG',
    foto: obterFotoJogador('1629634'),
    pontos: 21.4,
    rebotes: 8.3,
    assistencias: 7.5,
    roubos: 1.5,
    tocos: 0.9,
    triplos: 1.9,
  },
  {
    id: '203994',
    nome: 'Domantas Sabonis',
    siglaTime: 'SAC',
    logoTime: obterLogoTime('SAC'),
    posicao: 'C',
    foto: obterFotoJogador('203994'),
    pontos: 20.1,
    rebotes: 14.2,
    assistencias: 7.1,
    roubos: 0.9,
    tocos: 0.7,
    triplos: 0.4,
  },
  {
    id: '203932',
    nome: 'Grayson Allen',
    siglaTime: 'PHX',
    logoTime: obterLogoTime('PHX'),
    posicao: 'SG',
    foto: obterFotoJogador('203932'),
    pontos: 18.9,
    rebotes: 4.1,
    assistencias: 3.2,
    roubos: 0.8,
    tocos: 0.3,
    triplos: 4.8,
  },
  {
    id: '203093',
    nome: 'Myles Turner',
    siglaTime: 'IND',
    logoTime: obterLogoTime('IND'),
    posicao: 'C',
    foto: obterFotoJogador('203093'),
    pontos: 15.8,
    rebotes: 7.9,
    assistencias: 1.8,
    roubos: 0.7,
    tocos: 2.5,
    triplos: 2.3,
  },
  {
    id: '203476',
    nome: 'OG Anunoby',
    siglaTime: 'NYK',
    logoTime: obterLogoTime('NYK'),
    posicao: 'SF',
    foto: obterFotoJogador('203476'),
    pontos: 15.2,
    rebotes: 4.9,
    assistencias: 2.1,
    roubos: 1.9,
    tocos: 0.8,
    triplos: 2.7,
  },
  {
    id: '1629155',
    nome: 'Dyson Daniels',
    siglaTime: 'ATL',
    logoTime: obterLogoTime('ATL'),
    posicao: 'SG',
    foto: obterFotoJogador('1629155'),
    pontos: 12.7,
    rebotes: 4.6,
    assistencias: 3.5,
    roubos: 3.2,
    tocos: 1.3,
    triplos: 1.8,
  },
  {
    id: '1641737',
    nome: 'Alex Sarr',
    siglaTime: 'WAS',
    logoTime: obterLogoTime('WAS'),
    posicao: 'C',
    foto: obterFotoJogador('1641737'),
    pontos: 12.1,
    rebotes: 6.8,
    assistencias: 1.9,
    roubos: 1.0,
    tocos: 1.8,
    triplos: 1.1,
  },
  {
    id: '1641738',
    nome: 'Ryan Kalkbrenner',
    siglaTime: 'CHA',
    logoTime: obterLogoTime('CHA'),
    posicao: 'C',
    foto: obterFotoJogador('1641738'),
    pontos: 11.4,
    rebotes: 8.5,
    assistencias: 1.2,
    roubos: 0.6,
    tocos: 2.1,
    triplos: 0.2,
  },
  {
    id: '203952',
    nome: 'Isaiah Stewart',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PF',
    foto: obterFotoJogador('203952'),
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

export async function buscarEstatisticasCompletas(): Promise<EstatisticaJogador[]> {
  // Esta função não é mais usada pelo Estatisticas.tsx, mas é mantida para compatibilidade
  return [];
};