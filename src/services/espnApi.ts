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

// ========== ESTATÍSTICAS - SOLUÇÃO DEFINITIVA (Dados Mock Completos NBA.com) ==========

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

// IDs de Time da NBA.com (para logos)
const TEAM_IDS: Record<string, string> = {
  'MIL': '1610612749',
  'DAL': '1610612742',
  'OKC': '1610612760',
  'PHI': '1610612755',
  'MIN': '1610612750',
  'DEN': '1610612743',
  'GSW': '1610612744',
  'BOS': '1610612738',
  'PHX': '1610612756',
  'LAL': '1610612747',
  'IND': '1610612754',
  'SAC': '1610612758',
  'SAS': '1610612759',
  'NOP': '1610612740',
  'UTA': '1610612762',
  'CLE': '1610612739',
  'MIA': '1610612748',
  'MEM': '1610612763',
  'ORL': '1610612753',
  'DET': '1610612765',
};

const obterFotoJogador = (id: string): string => {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
};

const obterLogoTime = (sigla: string): string => {
  const teamId = TEAM_IDS[sigla.toUpperCase()];
  if (!teamId) return '';
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
};

// DADOS MOCK REALISTAS com IDs NBA.com CORRETOS
const dadosComIdsCorretos: EstatisticaJogador[] = [
  {
    id: '203507', // Giannis Antetokounmpo
    nome: 'Giannis Antetokounmpo',
    siglaTime: 'MIL',
    logoTime: obterLogoTime('MIL'),
    posicao: 'PF',
    foto: obterFotoJogador('203507'),
    pontos: 32.1,
    rebotes: 11.5,
    assistencias: 6.2,
    roubos: 1.0,
    tocos: 1.4,
    triplos: 0.5,
  },
  {
    id: '1629029', // Luka Doncic
    nome: 'Luka Doncic',
    siglaTime: 'DAL',
    logoTime: obterLogoTime('DAL'),
    posicao: 'PG',
    foto: obterFotoJogador('1629029'),
    pontos: 28.4,
    rebotes: 8.1,
    assistencias: 9.8,
    roubos: 1.4,
    tocos: 0.5,
    triplos: 3.0,
  },
  {
    id: '1628983', // Shai Gilgeous-Alexander
    nome: 'Shai Gilgeous-Alexander',
    siglaTime: 'OKC',
    logoTime: obterLogoTime('OKC'),
    posicao: 'PG',
    foto: obterFotoJogador('1628983'),
    pontos: 30.8,
    rebotes: 5.5,
    assistencias: 6.2,
    roubos: 2.0,
    tocos: 1.0,
    triplos: 2.1,
  },
  {
    id: '203954', // Joel Embiid
    nome: 'Joel Embiid',
    siglaTime: 'PHI',
    logoTime: obterLogoTime('PHI'),
    posicao: 'C',
    foto: obterFotoJogador('203954'),
    pontos: 34.7,
    rebotes: 11.0,
    assistencias: 5.6,
    roubos: 1.2,
    tocos: 1.7,
    triplos: 1.2,
  },
  {
    id: '1630162', // Anthony Edwards
    nome: 'Anthony Edwards',
    siglaTime: 'MIN',
    logoTime: obterLogoTime('MIN'),
    posicao: 'SG',
    foto: obterFotoJogador('1630162'),
    pontos: 25.9,
    rebotes: 5.4,
    assistencias: 5.1,
    roubos: 1.3,
    tocos: 0.5,
    triplos: 2.9,
  },
  {
    id: '203999', // Nikola Jokic
    nome: 'Nikola Jokic',
    siglaTime: 'DEN',
    logoTime: obterLogoTime('DEN'),
    posicao: 'C',
    foto: obterFotoJogador('203999'),
    pontos: 26.4,
    rebotes: 12.4,
    assistencias: 9.0,
    roubos: 1.4,
    tocos: 0.9,
    triplos: 1.2,
  },
  {
    id: '201939', // Stephen Curry
    nome: 'Stephen Curry',
    siglaTime: 'GSW',
    logoTime: obterLogoTime('GSW'),
    posicao: 'PG',
    foto: obterFotoJogador('201939'),
    pontos: 26.3,
    rebotes: 4.5,
    assistencias: 5.1,
    roubos: 0.8,
    tocos: 0.4,
    triplos: 4.8,
  },
  {
    id: '1628369', // Jayson Tatum
    nome: 'Jayson Tatum',
    siglaTime: 'BOS',
    logoTime: obterLogoTime('BOS'),
    posicao: 'SF',
    foto: obterFotoJogador('1628369'),
    pontos: 27.1,
    rebotes: 8.0,
    assistencias: 4.9,
    roubos: 1.0,
    tocos: 0.6,
    triplos: 3.1,
  },
  {
    id: '201142', // Kevin Durant
    nome: 'Kevin Durant',
    siglaTime: 'PHX',
    logoTime: obterLogoTime('PHX'),
    posicao: 'PF',
    foto: obterFotoJogador('201142'),
    pontos: 28.5,
    rebotes: 6.6,
    assistencias: 5.0,
    roubos: 0.9,
    tocos: 1.2,
    triplos: 2.5,
  },
  {
    id: '2544', // LeBron James
    nome: 'LeBron James',
    siglaTime: 'LAL',
    logoTime: obterLogoTime('LAL'),
    posicao: 'SF',
    foto: obterFotoJogador('2544'),
    pontos: 25.7,
    rebotes: 7.3,
    assistencias: 8.3,
    roubos: 1.3,
    tocos: 0.5,
    triplos: 2.2,
  },
  {
    id: '203081', // Damian Lillard
    nome: 'Damian Lillard',
    siglaTime: 'MIL',
    logoTime: obterLogoTime('MIL'),
    posicao: 'PG',
    foto: obterFotoJogador('203081'),
    pontos: 24.3,
    rebotes: 4.4,
    assistencias: 7.0,
    roubos: 1.0,
    tocos: 0.3,
    triplos: 3.4,
  },
  {
    id: '1627734', // Domantas Sabonis
    nome: 'Domantas Sabonis',
    siglaTime: 'SAC',
    logoTime: obterLogoTime('SAC'),
    posicao: 'C',
    foto: obterFotoJogador('1627734'),
    pontos: 19.4,
    rebotes: 13.7,
    assistencias: 8.2,
    roubos: 0.8,
    tocos: 0.6,
    triplos: 0.3,
  },
  {
    id: '1630169', // Tyrese Haliburton
    nome: 'Tyrese Haliburton',
    siglaTime: 'IND',
    logoTime: obterLogoTime('IND'),
    posicao: 'PG',
    foto: obterFotoJogador('1630169'),
    pontos: 20.1,
    rebotes: 3.9,
    assistencias: 10.9,
    roubos: 1.2,
    tocos: 0.7,
    triplos: 2.8,
  },
  {
    id: '1641705', // Victor Wembanyama
    nome: 'Victor Wembanyama',
    siglaTime: 'SAS',
    logoTime: obterLogoTime('SAS'),
    posicao: 'C',
    foto: obterFotoJogador('1641705'),
    pontos: 21.4,
    rebotes: 10.6,
    assistencias: 3.9,
    roubos: 1.2,
    tocos: 3.6,
    triplos: 1.8,
  },
  {
    id: '1629668', // Zion Williamson
    nome: 'Zion Williamson',
    siglaTime: 'NOP',
    logoTime: obterLogoTime('NOP'),
    posicao: 'PF',
    foto: obterFotoJogador('1629668'),
    pontos: 23.0,
    rebotes: 5.8,
    assistencias: 5.0,
    roubos: 1.1,
    tocos: 0.7,
    triplos: 0.2,
  },
  {
    id: '1628374', // Lauri Markkanen
    nome: 'Lauri Markkanen',
    siglaTime: 'UTA',
    logoTime: obterLogoTime('UTA'),
    posicao: 'PF',
    foto: obterFotoJogador('1628374'),
    pontos: 23.2,
    rebotes: 8.2,
    assistencias: 2.0,
    roubos: 0.7,
    tocos: 0.5,
    triplos: 3.0,
  },
  {
    id: '1628378', // Donovan Mitchell
    nome: 'Donovan Mitchell',
    siglaTime: 'CLE',
    logoTime: obterLogoTime('CLE'),
    posicao: 'SG',
    foto: obterFotoJogador('1628378'),
    pontos: 26.6,
    rebotes: 5.1,
    assistencias: 6.1,
    roubos: 1.8,
    tocos: 0.4,
    triplos: 3.3,
  },
  {
    id: '1628368', // De'Aaron Fox
    nome: 'De\'Aaron Fox',
    siglaTime: 'SAC',
    logoTime: obterLogoTime('SAC'),
    posicao: 'PG',
    foto: obterFotoJogador('1628368'),
    pontos: 25.7,
    rebotes: 4.4,
    assistencias: 5.6,
    roubos: 1.5,
    tocos: 0.4,
    triplos: 2.5,
  },
  {
    id: '1628389', // Bam Adebayo
    nome: 'Bam Adebayo',
    siglaTime: 'MIA',
    logoTime: obterLogoTime('MIA'),
    posicao: 'C',
    foto: obterFotoJogador('1628389'),
    pontos: 20.4,
    rebotes: 10.4,
    assistencias: 3.9,
    roubos: 1.1,
    tocos: 0.9,
    triplos: 0.0,
  },
  {
    id: '1630217', // Desmond Bane
    nome: 'Desmond Bane',
    siglaTime: 'MEM',
    logoTime: obterLogoTime('MEM'),
    posicao: 'SG',
    foto: obterFotoJogador('1630217'),
    pontos: 23.7,
    rebotes: 4.4,
    assistencias: 5.5,
    roubos: 1.0,
    tocos: 0.4,
    triplos: 3.0,
  },
  {
    id: '1631094', // Paolo Banchero
    nome: 'Paolo Banchero',
    siglaTime: 'ORL',
    logoTime: obterLogoTime('ORL'),
    posicao: 'PF',
    foto: obterFotoJogador('1631094'),
    pontos: 22.6,
    rebotes: 6.9,
    assistencias: 5.4,
    roubos: 0.9,
    tocos: 0.6,
    triplos: 1.5,
  },
  {
    id: '1630596', // Cade Cunningham
    nome: 'Cade Cunningham',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PG',
    foto: obterFotoJogador('1630596'),
    pontos: 22.7,
    rebotes: 4.3,
    assistencias: 7.5,
    roubos: 0.9,
    tocos: 0.4,
    triplos: 2.1,
  },
];

export async function buscarLideresEstatisticas(): Promise<DadosEstatisticas> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    pontos: [...dadosComIdsCorretos].sort((a, b) => b.pontos - a.pontos),
    rebotes: [...dadosComIdsCorretos].sort((a, b) => b.rebotes - a.rebotes),
    assistencias: [...dadosComIdsCorretos].sort((a, b) => b.assistencias - a.assistencias),
    roubos: [...dadosComIdsCorretos].sort((a, b) => b.roubos - a.roubos),
    tocos: [...dadosComIdsCorretos].sort((a, b) => b.tocos - a.tocos),
    triplos: [...dadosComIdsCorretos].sort((a, b) => b.triplos - a.triplos),
  };
}

// Função mantida para compatibilidade (não mais usada)
export async function buscarEstatisticasCompletas(): Promise<EstatisticaJogador[]> {
  return dadosComIdsCorretos;
}