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

// ========== ESTATÍSTICAS - SOLUÇÃO CORRIGIDA ==========

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

export async function buscarLideresEstatisticas(): Promise<DadosEstatisticas> {
  try {
    // ✅ CORREÇÃO: Chamando o endpoint /leaders
    const response = await axios.get(
      `${ESPN_API_BASE}/leaders`
    );

    const categorias = response.data.categories || [];
    
    // Objeto para armazenar jogadores únicos com TODAS as suas estatísticas
    const jogadoresMap = new Map<string, EstatisticaJogador>();

    // Função para processar cada categoria
    const processarCategoria = (categoria: any, nomeStat: keyof Omit<EstatisticaJogador, 'id' | 'nome' | 'siglaTime' | 'logoTime' | 'posicao' | 'foto'>) => {
      const leaders = categoria?.leaders || [];
      
      leaders.forEach((leader: any) => {
        const athlete = leader.athlete;
        if (!athlete) return;

        const playerId = athlete.id?.toString() || '';
        const team = athlete.team;
        const siglaTime = team?.abbreviation || team?.shortDisplayName || 'N/A';
        const position = athlete.position?.abbreviation || 'N/A';
        // Usamos o value, que é o valor numérico, e garantimos que é um float ou 0
        const displayValue = parseFloat(leader.value) || 0; 

        // Se o jogador já existe no Map, apenas atualiza a estatística específica
        if (jogadoresMap.has(playerId)) {
          const jogadorExistente = jogadoresMap.get(playerId)!;
          // Atualiza apenas se o valor for maior que zero (para não sobrescrever com 0)
          if (displayValue > 0) {
            (jogadorExistente[nomeStat] as number) = displayValue;
          }
        } else {
          // Cria novo jogador com todas as estatísticas zeradas
          jogadoresMap.set(playerId, {
            id: playerId,
            nome: athlete.displayName || athlete.name || 'Desconhecido',
            siglaTime: siglaTime,
            logoTime: obterLogoTime(siglaTime),
            posicao: position,
            foto: obterFotoJogador(playerId),
            pontos: nomeStat === 'pontos' ? displayValue : 0,
            rebotes: nomeStat === 'rebotes' ? displayValue : 0,
            assistencias: nomeStat === 'assistencias' ? displayValue : 0,
            roubos: nomeStat === 'roubos' ? displayValue : 0,
            tocos: nomeStat === 'tocos' ? displayValue : 0,
            triplos: nomeStat === 'triplos' ? displayValue : 0,
          });
        }
      });
    };

    // Mapear categorias da ESPN para nossas categorias
    categorias.forEach((categoria: any) => {
      const name = categoria.name?.toLowerCase() || '';
      
      if (name.includes('point') || name.includes('scoring')) {
        processarCategoria(categoria, 'pontos');
      } else if (name.includes('rebound')) {
        processarCategoria(categoria, 'rebotes');
      } else if (name.includes('assist')) {
        processarCategoria(categoria, 'assistencias');
      } else if (name.includes('steal')) {
        processarCategoria(categoria, 'roubos');
      } else if (name.includes('block')) {
        processarCategoria(categoria, 'tocos');
      } else if (name.includes('three') || name.includes('3-point')) {
        processarCategoria(categoria, 'triplos');
      }
    });

    // Converter Map para Array
    const todosJogadores = Array.from(jogadoresMap.values());

    // Separar por categoria (ordenados)
    return {
      pontos: [...todosJogadores].sort((a, b) => b.pontos - a.pontos),
      rebotes: [...todosJogadores].sort((a, b) => b.rebotes - a.rebotes),
      assistencias: [...todosJogadores].sort((a, b) => b.assistencias - a.assistencias),
      roubos: [...todosJogadores].sort((a, b) => b.roubos - a.roubos),
      tocos: [...todosJogadores].sort((a, b) => b.tocos - a.tocos),
      triplos: [...todosJogadores].sort((a, b) => b.triplos - a.triplos),
    };

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      pontos: [],
      rebotes: [],
      assistencias: [],
      roubos: [],
      tocos: [],
      triplos: [],
    };
  }
}

// Função para buscar estatísticas completas de todos os jogadores (mantida, mas não usada no Estatisticas.tsx)
export const buscarEstatisticasCompletas = async (): Promise<EstatisticaJogador[]> => {
  // Esta função não é mais usada pelo Estatisticas.tsx, mas é mantida para compatibilidade
  return [];
};