import { useState } from 'react';
import { api } from '../libs/api';
import { PlanillaCSVRow } from '../utils/csvPlanillaValidator';

export interface BulkPlanillaResult {
  success: boolean;
  created: number;
  failed: number;
  planillas?: Array<{
    team_id: string;
    username: string;
    email: string;
    password: string;
    planilla_id?: string;
  }>;
  errors?: Array<{
    team_id: string;
    error: string;
  }>;
}

export const useBulkPlanillas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBulkPlanillas = async (planillas: PlanillaCSVRow[]): Promise<BulkPlanillaResult> => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.post<BulkPlanillaResult>('planillas.php?bulk=true', { planillas });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear planillas masivamente';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createBulkPlanillas,
    loading,
    error,
  };
};
