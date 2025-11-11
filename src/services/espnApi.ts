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
  const hoje = new Date().toISOString().split('T')[0];
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

// ========== ESTATÍSTICAS DE JOGADORES ==========

export interface EstatisticaJogador {
  id: string;
  nome: string;
  time: string;
  siglaTime: string;
  logoTime: string;
  posicao: string;
  jogosDispputados: number;
  minutos: number;
  pontos: number;
  rebotes: number;
  assistencias: number;
  roubos: number;
  tocos: number;
  arremessosConvertidos: number;
  arremessosTentados: number;
  percentualArremessos: number;
  triplosConvertidos: number;
  triplosTentados: number;
  percentualTriplos: number;
  lancesLivresConvertidos: number;
  lancesLivresTentados: number;
  percentualLancesLivres: number;
  erros: number;
  duploDuplo: number;
  triploDuplo: number;
  foto: string;
}

// Função para buscar líderes de estatísticas por categoria
export const buscarLideresEstatisticas = async (): Promise<{
  pontos: EstatisticaJogador[];
  rebotes: EstatisticaJogador[];
  assistencias: EstatisticaJogador[];
  roubos: EstatisticaJogador[];
  tocos: EstatisticaJogador[];
  triplos: EstatisticaJogador[];
}> => {
  try {
    const response = await axios.get(`${ESPN_API_BASE}/leaders`);
    
    const processarLideres = (categoria: any): EstatisticaJogador[] => {
      if (!categoria?.leaders) return [];
      
      return categoria.leaders.slice(0, 5).map((lider: any) => {
        const athlete = lider.athlete;
        const team = lider.team;
        
        return {
          id: athlete.id,
          nome: athlete.displayName,
          time: team.name,
          siglaTime: team.abbreviation,
          logoTime: team.logos?.[0]?.href || '',
          posicao: athlete.position?.abbreviation || 'N/A',
          jogosDispputados: 0,
          minutos: 0,
          pontos: lider.statistics?.find((s: any) => s.name === 'avgPoints')?.value || lider.value,
          rebotes: lider.statistics?.find((s: any) => s.name === 'avgRebounds')?.value || lider.value,
          assistencias: lider.statistics?.find((s: any) => s.name === 'avgAssists')?.value || lider.value,
          roubos: lider.statistics?.find((s: any) => s.name === 'avgSteals')?.value || lider.value,
          tocos: lider.statistics?.find((s: any) => s.name === 'avgBlocks')?.value || lider.value,
          arremessosConvertidos: 0,
          arremessosTentados: 0,
          percentualArremessos: 0,
          triplosConvertidos: lider.statistics?.find((s: any) => s.name === 'avgThreePointFieldGoalsMade')?.value || lider.value,
          triplosTentados: 0,
          percentualTriplos: 0,
          lancesLivresConvertidos: 0,
          lancesLivresTentados: 0,
          percentualLancesLivres: 0,
          erros: 0,
          duploDuplo: 0,
          triploDuplo: 0,
          foto: athlete.headshot?.href || ''
        };
      });
    };

    const categorias = response.data.categories;
    
    return {
      pontos: processarLideres(categorias?.find((c: any) => c.name === 'avgPoints')),
      rebotes: processarLideres(categorias?.find((c: any) => c.name === 'avgRebounds')),
      assistencias: processarLideres(categorias?.find((c: any) => c.name === 'avgAssists')),
      roubos: processarLideres(categorias?.find((c: any) => c.name === 'avgSteals')),
      tocos: processarLideres(categorias?.find((c: any) => c.name === 'avgBlocks')),
      triplos: processarLideres(categorias?.find((c: any) => c.name === 'avgThreePointFieldGoalsMade'))
    };
  } catch (error) {
    console.error('Erro ao buscar líderes:', error);
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
        jogosDispputados: stats.gamesPlayed || 0,
        minutos: parseFloat(stats.avgMinutes || 0),
        pontos: parseFloat(stats.avgPoints || 0),
        rebotes: parseFloat(stats.avgRebounds || 0),
        assistencias: parseFloat(stats.avgAssists || 0),
        roubos: parseFloat(stats.avgSteals || 0),
        tocos: parseFloat(stats.avgBlocks || 0),
        arremessosConvertidos: parseFloat(stats.avgFieldGoalsMade || 0),
        arremessosTentados: parseFloat(stats.avgFieldGoalsAttempted || 0),
        percentualArremessos: parseFloat(stats.fieldGoalPct || 0),
        triplosConvertidos: parseFloat(stats.avgThreePointFieldGoalsMade || 0),
        triplosTentados: parseFloat(stats.avgThreePointFieldGoalsAttempted || 0),
        percentualTriplos: parseFloat(stats.threePointFieldGoalPct || 0),
        lancesLivresConvertidos: parseFloat(stats.avgFreeThrowsMade || 0),
        lancesLivresTentados: parseFloat(stats.avgFreeThrowsAttempted || 0),
        percentualLancesLivres: parseFloat(stats.freeThrowPct || 0),
        erros: parseFloat(stats.avgTurnovers || 0),
        duploDuplo: stats.doubleDouble || 0,
        triploDuplo: stats.tripleDouble || 0,
        foto: athlete.headshot?.href || ''
      };
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas completas:', error);
    return [];
  }
};