import { useState } from 'react';
import { api } from '../libs/api';
import { TeamCSVRow } from '../utils/csvTeamValidator';

export interface BulkTeamResult {
  success: boolean;
  created: number;
  failed: number;
  errors?: Array<{
    nombre: string;
    shortname: string;
    category: number;
    error: string;
  }>;
}

export const useBulkTeams = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBulkTeams = async (teams: TeamCSVRow[]): Promise<BulkTeamResult> => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.post<BulkTeamResult>('teams.php?bulk=true', { teams });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear equipos masivamente';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createBulkTeams,
    loading,
    error,
  };
};
