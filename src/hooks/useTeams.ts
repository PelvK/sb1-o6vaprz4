import { useState, useEffect } from 'react';
import { supabase } from '../libs/supabase';
import { Team } from '../types';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return { teams, loading, error, refetch: fetchTeams };
};
