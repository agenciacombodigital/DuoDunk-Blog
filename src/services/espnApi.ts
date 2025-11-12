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

// ========== ESTATÍSTICAS - SOLUÇÃO CORRIGIDA (Usando /athletes) ==========

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

// Função auxiliar para obter URL de foto com fallback
const obterFotoJogador = (id: string): string => {
  if (!id || id === 'undefined') {
    return 'https://a.espncdn.com/combiner/i?img=i/headshots/nba/players/full/default.png&w=350&h=254';
  }
  return `https://a.espncdn.com/combiner/i?img=i/headshots/nba/players/full/${id}.png&w=350&h=254`;
};

// Função auxiliar para obter logo do time
const obterLogoTime = (sigla: string): string => {
  if (!sigla || sigla === 'undefined') {
    return '';
  }
  // Usamos o endpoint de logo da ESPN que aceita a abreviação
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${sigla.toLowerCase()}.png&h=100&w=100`;
};

// Função para buscar estatísticas completas de todos os jogadores
export async function buscarEstatisticasCompletas(): Promise<EstatisticaJogador[]> {
  try {
    // Endpoint que fornece dados de jogadores com estatísticas médias
    const response = await axios.get(`${ESPN_API_BASE}/athletes`);
    
    if (!response.data.entries) return [];
    
    return response.data.entries.map((entry: any) => {
      const athlete = entry.athlete;
      const team = entry.team;
      const stats = entry.statistics || {};
      
      // Extrai estatísticas médias (avg)
      const avgStats = stats.splits?.find((s: any) => s.name === 'averages')?.categories?.[0]?.statistics || [];
      
      const getStatValue = (name: string) => {
        const stat = avgStats.find((s: any) => s.name === name);
        return parseFloat(stat?.displayValue || stat?.value || 0);
      };

      const siglaTime = team?.abbreviation || team?.shortDisplayName || 'N/A';

      return {
        id: athlete.id,
        nome: athlete.displayName || athlete.name || 'Desconhecido',
        siglaTime: siglaTime,
        logoTime: obterLogoTime(siglaTime),
        posicao: athlete.position?.abbreviation || 'N/A',
        foto: athlete.headshot?.href || obterFotoJogador(athlete.id),
        
        // Mapeamento das estatísticas
        pontos: getStatValue('points'),
        rebotes: getStatValue('rebounds'),
        assistencias: getStatValue('assists'),
        roubos: getStatValue('steals'),
        tocos: getStatValue('blocks'),
        triplos: getStatValue('threePointFieldGoalsMade'),
      };
    }).filter((p: EstatisticaJogador) => p.pontos > 0); // Filtra jogadores sem estatísticas válidas
  } catch (error) {
    console.error('Erro ao buscar estatísticas completas:', error);
    return [];
  }
};

// Função principal para a página de líderes
export async function buscarLideresEstatisticas(): Promise<DadosEstatisticas> {
  const todosJogadores = await buscarEstatisticasCompletas();

  // Função auxiliar para ordenar e retornar a lista
  const ordenar = (stat: keyof EstatisticaJogador) => 
    [...todosJogadores]
      .sort((a, b) => (b[stat] as number) - (a[stat] as number))
      .slice(0, 50); // Limita aos 50 melhores

  return {
    pontos: ordenar('pontos'),
    rebotes: ordenar('rebotes'),
    assistencias: ordenar('assistencias'),
    roubos: ordenar('roubos'),
    tocos: ordenar('tocos'),
    triplos: ordenar('triplos'),
  };
}