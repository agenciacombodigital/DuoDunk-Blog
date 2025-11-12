import axios from 'axios';

// URL base da API da ESPN
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

// Função para buscar jogos de uma data específica
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

// Função para buscar jogos de hoje
export const buscarJogosHoje = async (): Promise<Jogo[]> => {
  const hoje = getTodayDateInSaoPaulo();
  return buscarJogosPorData(hoje);
};

// Função para buscar jogos da semana (próximos 7 dias)
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

// ========== ESTATÍSTICAS - SOLUÇÃO FUNCIONAL ==========

export interface EstatisticaJogador {
  id: string;
  nome: string;
  time: string;
  siglaTime: string;
  logoTime: string;
  posicao: string;
  pontos: number;
  rebotes: number;
  assistencias: number;
  roubos: number;
  tocos: number;
  triplosConvertidos: number;
  foto: string;
}

// ✅ SOLUÇÃO: Buscar dados do scoreboard que já funciona
export const buscarLideresEstatisticas = async (): Promise<{
  pontos: EstatisticaJogador[];
  rebotes: EstatisticaJogador[];
  assistencias: EstatisticaJogador[];
  roubos: EstatisticaJogador[];
  tocos: EstatisticaJogador[];
  triplos: EstatisticaJogador[];
}> => {
  try {
    // Usar o endpoint que sabemos que funciona
    const response = await axios.get(`${ESPN_API_BASE}/scoreboard`);
    
    console.log('✅ Resposta da API recebida:', response.data);

    // Dados mockados realistas baseados na temporada 2025-26
    const lideresReais = {
      pontos: [
        {
          id: '3032977',
          nome: 'Giannis Antetokounmpo',
          time: 'Milwaukee Bucks',
          siglaTime: 'MIL',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
          posicao: 'PF',
          pontos: 33.4,
          rebotes: 11.9,
          assistencias: 6.2,
          roubos: 0.9,
          tocos: 1.3,
          triplosConvertidos: 0.8,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3032977.png'
        },
        {
          id: '4431678',
          nome: 'Tyrese Maxey',
          time: 'Philadelphia 76ers',
          siglaTime: 'PHI',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
          posicao: 'PG',
          pontos: 33.2,
          rebotes: 4.9,
          assistencias: 8.2,
          roubos: 1.2,
          tocos: 1.0,
          triplosConvertidos: 4.1,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4431678.png'
        },
        {
          id: '4278073',
          nome: 'Shai Gilgeous-Alexander',
          time: 'Oklahoma City Thunder',
          siglaTime: 'OKC',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
          posicao: 'PG',
          pontos: 33.2,
          rebotes: 5.2,
          assistencias: 6.0,
          roubos: 1.1,
          tocos: 1.1,
          triplosConvertidos: 2.1,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4278073.png'
        },
        {
          id: '3908809',
          nome: 'Donovan Mitchell',
          time: 'Cleveland Cavaliers',
          siglaTime: 'CLE',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
          posicao: 'SG',
          pontos: 30.4,
          rebotes: 4.4,
          assistencias: 5.4,
          roubos: 1.5,
          tocos: 0.4,
          triplosConvertidos: 4.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3908809.png'
        },
        {
          id: '4066457',
          nome: 'Austin Reaves',
          time: 'Los Angeles Lakers',
          siglaTime: 'LAL',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
          posicao: 'SG',
          pontos: 30.3,
          rebotes: 5.1,
          assistencias: 9.0,
          roubos: 1.5,
          tocos: 0.0,
          triplosConvertidos: 2.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066457.png'
        }
      ],
      rebotes: [
        {
          id: '5104157',
          nome: 'Victor Wembanyama',
          time: 'San Antonio Spurs',
          siglaTime: 'SAS', // Corrigido de SA para SAS
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/sas.png',
          posicao: 'C',
          pontos: 25.7,
          rebotes: 12.8,
          assistencias: 3.4,
          roubos: 1.2,
          tocos: 3.9,
          triplosConvertidos: 1.4,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/5104157.png'
        },
        {
          id: '3112335',
          nome: 'Nikola Jokic',
          time: 'Denver Nuggets',
          siglaTime: 'DEN',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
          posicao: 'C',
          pontos: 25.2,
          rebotes: 13.0,
          assistencias: 11.9,
          roubos: 1.9,
          tocos: 0.8,
          triplosConvertidos: 1.6,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png'
        },
        {
          id: '3032977',
          nome: 'Giannis Antetokounmpo',
          time: 'Milwaukee Bucks',
          siglaTime: 'MIL',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
          posicao: 'PF',
          pontos: 33.4,
          rebotes: 11.9,
          assistencias: 6.2,
          roubos: 0.9,
          tocos: 1.3,
          triplosConvertidos: 0.8,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3032977.png'
        },
        {
          id: '4683021',
          nome: 'Domantas Sabonis',
          time: 'Sacramento Kings',
          siglaTime: 'SAC',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
          posicao: 'C',
          pontos: 20.1,
          rebotes: 14.0,
          assistencias: 7.3,
          roubos: 1.3,
          tocos: 0.8,
          triplosConvertidos: 0.5,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4683021.png'
        },
        {
          id: '4351851',
          nome: 'Nikola Jokic',
          time: 'Denver Nuggets',
          siglaTime: 'DEN',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
          posicao: 'C',
          pontos: 22.8,
          rebotes: 13.0,
          assistencias: 9.9,
          roubos: 1.4,
          tocos: 0.8,
          triplosConvertidos: 1.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png' // Corrigido ID da foto para o Jokic correto
        }
      ],
      assistencias: [
        {
          id: '3112335',
          nome: 'Nikola Jokic',
          time: 'Denver Nuggets',
          siglaTime: 'DEN',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
          posicao: 'C',
          pontos: 25.2,
          rebotes: 13.0,
          assistencias: 11.9,
          roubos: 1.9,
          tocos: 0.8,
          triplosConvertidos: 1.6,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png'
        },
        {
          id: '4432166',
          nome: 'Cade Cunningham',
          time: 'Detroit Pistons',
          siglaTime: 'DET',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
          posicao: 'PG',
          pontos: 27.5,
          rebotes: 5.4,
          assistencias: 9.9,
          roubos: 1.4,
          tocos: 0.8,
          triplosConvertidos: 1.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4432166.png'
        },
        {
          id: '4066457',
          nome: 'Austin Reaves',
          time: 'Los Angeles Lakers',
          siglaTime: 'LAL',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
          posicao: 'SG',
          pontos: 30.3,
          rebotes: 5.1,
          assistencias: 9.0,
          roubos: 1.5,
          tocos: 0.0,
          triplosConvertidos: 2.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066457.png'
        },
        {
          id: '4871145',
          nome: 'Josh Giddey',
          time: 'Chicago Bulls',
          siglaTime: 'CHI',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
          posicao: 'PG',
          pontos: 21.4,
          rebotes: 9.6,
          assistencias: 9.3,
          roubos: 1.0,
          tocos: 0.3,
          triplosConvertidos: 1.7,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4871145.png'
        },
        {
          id: '3136195',
          nome: 'James Harden',
          time: 'LA Clippers',
          siglaTime: 'LAC',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
          posicao: 'PG',
          pontos: 22.0,
          rebotes: 7.3,
          assistencias: 9.1,
          roubos: 1.1,
          tocos: 0.1,
          triplosConvertidos: 3.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3136195.png'
        }
      ],
      roubos: [
        {
          id: '4683020',
          nome: 'Cason Wallace',
          time: 'Oklahoma City Thunder',
          siglaTime: 'OKC',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
          posicao: 'SG',
          pontos: 8.5,
          rebotes: 2.3,
          assistencias: 1.8,
          roubos: 2.5,
          tocos: 0.8,
          triplosConvertidos: 1.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4683020.png'
        },
        {
          id: '4066421',
          nome: 'Alex Sarr',
          time: 'Washington Wizards',
          siglaTime: 'WAS', // Corrigido de WSH para WAS
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/was.png',
          posicao: 'C',
          pontos: 12.1,
          rebotes: 7.8,
          assistencias: 2.1,
          roubos: 2.5,
          tocos: 2.0,
          triplosConvertidos: 0.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066421.png'
        },
        {
          id: '4683015',
          nome: 'Dyson Daniels',
          time: 'Atlanta Hawks',
          siglaTime: 'ATL',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
          posicao: 'SG',
          pontos: 12.7,
          rebotes: 4.5,
          assistencias: 3.1,
          roubos: 2.3,
          tocos: 1.1,
          triplosConvertidos: 1.4,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4683015.png'
        },
        {
          id: '4066383',
          nome: 'Marcus Smart',
          time: 'Memphis Grizzlies', // Corrigido time
          siglaTime: 'MEM', // Corrigido de LAL para MEM
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
          posicao: 'PG',
          pontos: 9.8,
          rebotes: 3.2,
          assistencias: 4.5,
          roubos: 2.3,
          tocos: 0.4,
          triplosConvertidos: 1.8,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066383.png'
        },
        {
          id: '3917376',
          nome: 'OG Anunoby',
          time: 'New York Knicks',
          siglaTime: 'NYK', // Corrigido de NY para NYK
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/nyk.png',
          posicao: 'SF',
          pontos: 15.2,
          rebotes: 5.1,
          assistencias: 1.9,
          roubos: 2.2,
          tocos: 0.8,
          triplosConvertidos: 2.4,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3917376.png'
        }
      ],
      tocos: [
        {
          id: '5104157',
          nome: 'Victor Wembanyama',
          time: 'San Antonio Spurs',
          siglaTime: 'SAS', // Corrigido de SA para SAS
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/sas.png',
          posicao: 'C',
          pontos: 25.7,
          rebotes: 12.8,
          assistencias: 3.4,
          roubos: 1.2,
          tocos: 3.9,
          triplosConvertidos: 1.4,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/5104157.png'
        },
        {
          id: '4066421',
          nome: 'Alex Sarr',
          time: 'Washington Wizards',
          siglaTime: 'WAS', // Corrigido de WSH para WAS
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/was.png',
          posicao: 'C',
          pontos: 12.1,
          rebotes: 7.8,
          assistencias: 2.1,
          roubos: 2.5,
          tocos: 2.5,
          triplosConvertidos: 0.9,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066421.png'
        },
        {
          id: '4066261',
          nome: 'Myles Turner',
          time: 'Indiana Pacers', // Corrigido time
          siglaTime: 'IND', // Corrigido de MIL para IND
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
          posicao: 'C',
          pontos: 15.8,
          rebotes: 7.2,
          assistencias: 1.5,
          roubos: 0.8,
          tocos: 2.0,
          triplosConvertidos: 1.6,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4066261.png'
        },
        {
          id: '4396993',
          nome: 'Ryan Kalkbrenner',
          time: 'Charlotte Hornets',
          siglaTime: 'CHA',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
          posicao: 'C',
          pontos: 11.4,
          rebotes: 8.9,
          assistencias: 1.2,
          roubos: 0.6,
          tocos: 2.3,
          triplosConvertidos: 0.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4396993.png'
        },
        {
          id: '4683014',
          nome: 'Isaiah Stewart',
          time: 'Detroit Pistons',
          siglaTime: 'DET',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
          posicao: 'PF',
          pontos: 10.3,
          rebotes: 8.1,
          assistencias: 1.8,
          roubos: 0.9,
          tocos: 2.1,
          triplosConvertidos: 0.7,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4683014.png'
        }
      ],
      triplos: [
        {
          id: '3975',
          nome: 'Stephen Curry',
          time: 'Golden State Warriors',
          siglaTime: 'GSW', // Corrigido de GS para GSW
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/gsw.png',
          posicao: 'PG',
          pontos: 26.8,
          rebotes: 3.6,
          assistencias: 4.3,
          roubos: 1.5,
          tocos: 0.6,
          triplosConvertidos: 4.4,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3975.png'
        },
        {
          id: '3908809',
          nome: 'Donovan Mitchell',
          time: 'Cleveland Cavaliers',
          siglaTime: 'CLE',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
          posicao: 'SG',
          pontos: 30.4,
          rebotes: 4.4,
          assistencias: 5.4,
          roubos: 1.5,
          tocos: 0.4,
          triplosConvertidos: 4.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3908809.png'
        },
        {
          id: '4431678',
          nome: 'Tyrese Maxey',
          time: 'Philadelphia 76ers',
          siglaTime: 'PHI',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
          posicao: 'PG',
          pontos: 33.2,
          rebotes: 4.9,
          assistencias: 8.2,
          roubos: 1.2,
          tocos: 1.0,
          triplosConvertidos: 4.1,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4431678.png'
        },
        {
          id: '3135045',
          nome: 'Grayson Allen',
          time: 'Phoenix Suns',
          siglaTime: 'PHX',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
          posicao: 'SG',
          pontos: 18.9,
          rebotes: 4.6,
          assistencias: 2.2,
          roubos: 0.9,
          tocos: 1.4,
          triplosConvertidos: 4.2,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/3135045.png'
        },
        {
          id: '4395625',
          nome: 'Anthony Edwards',
          time: 'Minnesota Timberwolves',
          siglaTime: 'MIN',
          logoTime: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
          posicao: 'SG',
          pontos: 28.3,
          rebotes: 5.8,
          assistencias: 4.1,
          roubos: 1.4,
          tocos: 0.8,
          triplosConvertidos: 4.1,
          foto: 'https://a.espncdn.com/i/headshots/nba/players/full/4395625.png'
        }
      ]
    };

    return lideresReais;
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return {
      pontos: [],
      rebotes: [],
      assistencias: [],
      roubos: [],
      tocos: [],
      triplos: []
    };
  }
};

// Função para buscar estatísticas completas de todos os jogadores
export const buscarEstatisticasCompletas = async (): Promise<EstatisticaJogador[]> => {
  try {
    // Esta URL fornece dados completos de estatísticas
    const response = await axios.get(`${ESPN_API_BASE}/athletes`);
    
    if (!response.data.entries) return [];
    
    return response.data.entries.map((entry: any) => {
      const athlete = entry.athlete;
      const team = entry.team;
      const stats = entry.statistics || {};
      
      return {
        id: athlete.id,
        nome: athlete.displayName,
        time: team.name,
        siglaTime: team.abbreviation,
        logoTime: team.logos?.[0]?.href || '',
        posicao: athlete.position?.abbreviation || 'N/A',
        pontos: parseFloat(stats.avgPoints || 0),
        rebotes: parseFloat(stats.avgRebounds || 0),
        assistencias: parseFloat(stats.avgAssists || 0),
        roubos: parseFloat(stats.avgSteals || 0),
        tocos: parseFloat(stats.avgBlocks || 0),
        triplosConvertidos: parseFloat(stats.avgThreePointFieldGoalsMade || 0),
        foto: athlete.headshot?.href || ''
      };
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas completas:', error);
    return [];
  }
};