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

// DADOS MOCK REALISTAS PROJETADOS PARA O INÍCIO DA TEMPORADA 2025-26
const dadosComIdsCorretos: EstatisticaJogador[] = [
  {
    id: '203954', // Joel Embiid
    nome: 'Joel Embiid',
    siglaTime: 'PHI',
    logoTime: obterLogoTime('PHI'),
    posicao: 'C',
    foto: obterFotoJogador('203954'),
    pontos: 35.1, // Inflacionado no início
    rebotes: 11.2,
    assistencias: 5.8,
    roubos: 1.3,
    tocos: 1.8,
    triplos: 1.3,
  },
  {
    id: '203507', // Giannis Antetokounmpo
    nome: 'Giannis Antetokounmpo',
    siglaTime: 'MIL',
    logoTime: obterLogoTime('MIL'),
    posicao: 'PF',
    foto: obterFotoJogador('203507'),
    pontos: 33.5,
    rebotes: 11.8, // Líder de rebotes
    assistencias: 6.5,
    roubos: 1.1,
    tocos: 1.5,
    triplos: 0.6,
  },
  {
    id: '1628983', // Shai Gilgeous-Alexander
    nome: 'Shai Gilgeous-Alexander',
    siglaTime: 'OKC',
    logoTime: obterLogoTime('OKC'),
    posicao: 'PG',
    foto: obterFotoJogador('1628983'),
    pontos: 31.2,
    rebotes: 5.6,
    assistencias: 6.4,
    roubos: 2.2, // Líder de roubos
    tocos: 1.1,
    triplos: 2.3,
  },
  {
    id: '201142', // Kevin Durant
    nome: 'Kevin Durant',
    siglaTime: 'PHX',
    logoTime: obterLogoTime('PHX'),
    posicao: 'PF',
    foto: obterFotoJogador('201142'),
    pontos: 29.0,
    rebotes: 6.8,
    assistencias: 5.2,
    roubos: 1.0,
    tocos: 1.3,
    triplos: 2.6,
  },
  {
    id: '1629029', // Luka Doncic
    nome: 'Luka Doncic',
    siglaTime: 'DAL',
    logoTime: obterLogoTime('DAL'),
    posicao: 'PG',
    foto: obterFotoJogador('1629029'),
    pontos: 28.8,
    rebotes: 8.3,
    assistencias: 10.5, // Líder de assistências
    roubos: 1.5,
    tocos: 0.6,
    triplos: 3.2,
  },
  {
    id: '1628369', // Jayson Tatum
    nome: 'Jayson Tatum',
    siglaTime: 'BOS',
    logoTime: obterLogoTime('BOS'),
    posicao: 'SF',
    foto: obterFotoJogador('1628369'),
    pontos: 27.5,
    rebotes: 8.1,
    assistencias: 5.0,
    roubos: 1.1,
    tocos: 0.7,
    triplos: 3.3,
  },
  {
    id: '1628378', // Donovan Mitchell
    nome: 'Donovan Mitchell',
    siglaTime: 'CLE',
    logoTime: obterLogoTime('CLE'),
    posicao: 'SG',
    foto: obterFotoJogador('1628378'),
    pontos: 27.0,
    rebotes: 5.2,
    assistencias: 6.2,
    roubos: 1.9,
    tocos: 0.5,
    triplos: 3.4,
  },
  {
    id: '203999', // Nikola Jokic
    nome: 'Nikola Jokic',
    siglaTime: 'DEN',
    logoTime: obterLogoTime('DEN'),
    posicao: 'C',
    foto: obterFotoJogador('203999'),
    pontos: 26.8,
    rebotes: 12.0,
    assistencias: 9.2,
    roubos: 1.5,
    tocos: 1.0,
    triplos: 1.3,
  },
  {
    id: '201939', // Stephen Curry
    nome: 'Stephen Curry',
    siglaTime: 'GSW',
    logoTime: obterLogoTime('GSW'),
    posicao: 'PG',
    foto: obterFotoJogador('201939'),
    pontos: 26.5,
    rebotes: 4.6,
    assistencias: 5.2,
    roubos: 0.9,
    tocos: 0.4,
    triplos: 4.9, // Líder de triplos
  },
  {
    id: '1630162', // Anthony Edwards
    nome: 'Anthony Edwards',
    siglaTime: 'MIN',
    logoTime: obterLogoTime('MIN'),
    posicao: 'SG',
    foto: obterFotoJogador('1630162'),
    pontos: 26.1,
    rebotes: 5.5,
    assistencias: 5.2,
    roubos: 1.4,
    tocos: 0.6,
    triplos: 3.0,
  },
  {
    id: '2544', // LeBron James (Simulando que ainda não jogou)
    nome: 'LeBron James',
    siglaTime: 'LAL',
    logoTime: obterLogoTime('LAL'),
    posicao: 'SF',
    foto: obterFotoJogador('2544'),
    pontos: 0.0, // Estatística zerada
    rebotes: 0.0,
    assistencias: 0.0,
    roubos: 0.0,
    tocos: 0.0,
    triplos: 0.0,
  },
  {
    id: '1628368', // De'Aaron Fox
    nome: 'De\'Aaron Fox',
    siglaTime: 'SAC',
    logoTime: obterLogoTime('SAC'),
    posicao: 'PG',
    foto: obterFotoJogador('1628368'),
    pontos: 25.9,
    rebotes: 4.5,
    assistencias: 5.7,
    roubos: 1.6,
    tocos: 0.5,
    triplos: 2.6,
  },
  {
    id: '203081', // Damian Lillard
    nome: 'Damian Lillard',
    siglaTime: 'MIL',
    logoTime: obterLogoTime('MIL'),
    posicao: 'PG',
    foto: obterFotoJogador('203081'),
    pontos: 24.5,
    rebotes: 4.5,
    assistencias: 7.1,
    roubos: 1.1,
    tocos: 0.4,
    triplos: 3.5,
  },
  {
    id: '1630217', // Desmond Bane
    nome: 'Desmond Bane',
    siglaTime: 'MEM',
    logoTime: obterLogoTime('MEM'),
    posicao: 'SG',
    foto: obterFotoJogador('1630217'),
    pontos: 24.0,
    rebotes: 4.5,
    assistencias: 5.6,
    roubos: 1.1,
    tocos: 0.5,
    triplos: 3.1,
  },
  {
    id: '1628374', // Lauri Markkanen
    nome: 'Lauri Markkanen',
    siglaTime: 'UTA',
    logoTime: obterLogoTime('UTA'),
    posicao: 'PF',
    foto: obterFotoJogador('1628374'),
    pontos: 23.5,
    rebotes: 8.4,
    assistencias: 2.1,
    roubos: 0.8,
    tocos: 0.6,
    triplos: 3.1,
  },
  {
    id: '1629668', // Zion Williamson
    nome: 'Zion Williamson',
    siglaTime: 'NOP',
    logoTime: obterLogoTime('NOP'),
    posicao: 'PF',
    foto: obterFotoJogador('1629668'),
    pontos: 23.3,
    rebotes: 6.0,
    assistencias: 5.1,
    roubos: 1.2,
    tocos: 0.8,
    triplos: 0.3,
  },
  {
    id: '1630596', // Cade Cunningham
    nome: 'Cade Cunningham',
    siglaTime: 'DET',
    logoTime: obterLogoTime('DET'),
    posicao: 'PG',
    foto: obterFotoJogador('1630596'),
    pontos: 23.0,
    rebotes: 4.4,
    assistencias: 7.6,
    roubos: 1.0,
    tocos: 0.5,
    triplos: 2.2,
  },
  {
    id: '1631094', // Paolo Banchero
    nome: 'Paolo Banchero',
    siglaTime: 'ORL',
    logoTime: obterLogoTime('ORL'),
    posicao: 'PF',
    foto: obterFotoJogador('1631094'),
    pontos: 22.8,
    rebotes: 7.0,
    assistencias: 5.5,
    roubos: 1.0,
    tocos: 0.7,
    triplos: 1.6,
  },
  {
    id: '1641705', // Victor Wembanyama
    nome: 'Victor Wembanyama',
    siglaTime: 'SAS',
    logoTime: obterLogoTime('SAS'),
    posicao: 'C',
    foto: obterFotoJogador('1641705'),
    pontos: 22.0,
    rebotes: 10.8,
    assistencias: 4.0,
    roubos: 1.3,
    tocos: 3.8, // Líder de tocos
    triplos: 1.9,
  },
  {
    id: '1628389', // Bam Adebayo
    nome: 'Bam Adebayo',
    siglaTime: 'MIA',
    logoTime: obterLogoTime('MIA'),
    posicao: 'C',
    foto: obterFotoJogador('1628389'),
    pontos: 20.8,
    rebotes: 10.5,
    assistencias: 4.0,
    roubos: 1.2,
    tocos: 1.0,
    triplos: 0.0,
  },
  {
    id: '1630169', // Tyrese Haliburton
    nome: 'Tyrese Haliburton',
    siglaTime: 'IND',
    logoTime: obterLogoTime('IND'),
    posicao: 'PG',
    foto: obterFotoJogador('1630169'),
    pontos: 20.5,
    rebotes: 4.0,
    assistencias: 10.8,
    roubos: 1.3,
    tocos: 0.8,
    triplos: 2.9,
  },
];

export async function buscarLideresEstatisticas(): Promise<DadosEstatisticas> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filtra jogadores com estatísticas zeradas (simulando não ter jogado)
  const jogadoresAtivos = dadosComIdsCorretos.filter(p => p.pontos > 0 || p.rebotes > 0 || p.assistencias > 0);
  
  // Inclui jogadores inativos no final da lista de pontos, mas os exclui das outras listas
  const jogadoresInativos = dadosComIdsCorretos.filter(p => p.pontos === 0 && p.rebotes === 0 && p.assistencias === 0);

  return {
    pontos: [...jogadoresAtivos].sort((a, b) => b.pontos - a.pontos).concat(jogadoresInativos),
    rebotes: [...jogadoresAtivos].sort((a, b) => b.rebotes - a.rebotes).concat(jogadoresInativos),
    assistencias: [...jogadoresAtivos].sort((a, b) => b.assistencias - a.assistencias).concat(jogadoresInativos),
    roubos: [...jogadoresAtivos].sort((a, b) => b.roubos - a.roubos).concat(jogadoresInativos),
    tocos: [...jogadoresAtivos].sort((a, b) => b.tocos - a.tocos).concat(jogadoresInativos),
    triplos: [...jogadoresAtivos].sort((a, b) => b.triplos - a.triplos).concat(jogadoresInativos),
  };
}

// Função mantida para compatibilidade (não mais usada)
export async function buscarEstatisticasCompletas(): Promise<EstatisticaJogador[]> {
  return dadosComIdsCorretos;
}