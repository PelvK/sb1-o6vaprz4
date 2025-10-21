import { useState, useEffect, useCallback } from 'react';
import { api } from '../libs/api';
import { Team } from '../types';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Team[]>('teams.php');
      setTeams(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, loading, error, refetch: fetchTeams };
};

export const useTeam = (id: string) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Team>(`teams.php?id=${id}`);
      setTeam(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading team');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id, fetchTeam]);

  return { team, loading, error, refetch: fetchTeam };
};

export const createTeam = async (team: Partial<Team>) => {
  return api.post<{ id: string; message: string }>('teams.php', team);
};

export const updateTeam = async (id: string, team: Partial<Team>) => {
  return api.put<{ message: string }>('teams.php', { ...team, id });
};

export const deleteTeam = async (id: string) => {
  return api.delete<{ message: string }>(`teams.php?id=${id}`);
};
