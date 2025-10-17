import { useState } from 'react';

const API_BASE = '/api/nba';

interface Game {
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  date: string;
  time?: string;
  location?: string;
  outcome?: string;
}

interface Standing {
  team: string;
  wins: number;
  losses: number;
  win_percentage: number;
  conference: string;
}

interface Player {
  name: string;
  identifier: string;
  league: string;
  position: string;
}

interface Leader {
  name: string;
  team: string;
  stat: number;
  stat_label: string;
}

export const useNBAApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async (date?: string): Promise<Game[]> => {
    setLoading(true);
    setError(null);
    try {
      const url = date ? `${API_BASE}/scores?date=${date}` : `${API_BASE}/scores`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.games : [];
    } catch (err) {
      setError('Erro ao buscar placares');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/standings`);
      const data = await res.json();
      return data.success 
        ? { 
            eastern: data.eastern_conference, 
            western: data.western_conference 
          }
        : { eastern: [], western: [] };
    } catch (err) {
      setError('Erro ao buscar classificação');
      return { eastern: [], western: [] };
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async (days: number = 7): Promise<Game[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/calendar?days=${days}`);
      const data = await res.json();
      return data.success ? data.games : [];
    } catch (err) {
      setError('Erro ao buscar calendário');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchPlayers = async (name: string): Promise<Player[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/players?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      return data.success ? data.players : [];
    } catch (err) {
      setError('Erro ao buscar jogadores');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async (category: 'scoring' | 'rebounds' | 'assists' = 'scoring'): Promise<Leader[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/leaders?category=${category}&limit=10`);
      const data = await res.json();
      return data.success ? data.leaders : [];
    } catch (err) {
      setError('Erro ao buscar líderes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchScores,
    fetchStandings,
    fetchCalendar,
    searchPlayers,
    fetchLeaders,
    loading,
    error
  };
};