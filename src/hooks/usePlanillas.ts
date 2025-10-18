import { useState, useEffect, useCallback } from 'react';
import { api } from '../libs/api';
import { Planilla, PlanillaWithDetails } from '../types';

export const usePlanillas = () => {
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[DEBUG] PLANILLAS:", planillas);
  }, [planillas]);

  const fetchPlanillas = async () => {
    try {
      setLoading(true);
      const data = await api.get<Planilla[]>('planillas.php?&show_deleted=true');
      setPlanillas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading planillas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanillas();
  }, []);

  return { planillas, loading, error, refetch: fetchPlanillas };
};

export const usePlanilla = (id: string) => {
  const [planilla, setPlanilla] = useState<PlanillaWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[DEBUG] PLANILLA:", planilla);
    console.log("[DEBUG] PLANILLA ID:", id);
  }, [planilla, id]);

  const fetchPlanilla = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PlanillaWithDetails>(`planillas.php?id=${id}`);
      setPlanilla(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading planilla');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPlanilla();
    }
  }, [id, fetchPlanilla]);

  return { planilla, loading, error, refetch: fetchPlanilla };
};

export const createPlanilla = async (payload: {
  team_id: string;
  user_ids: string[];
  status?: string;
}) => {
  return api.post<{ id: string; assigned_count: number; message: string }>(
    'planillas.php',
    {
      team_id: payload.team_id,
      user_ids: payload.user_ids,
      status: payload.status ?? 'Pendiente de envío',
    }
  );
};


export const updatePlanilla = async (id: string, planilla: Partial<Planilla>) => {
  return api.put<{ message: string }>('planillas.php', { ...planilla, id });
};

export const deletePlanilla = async (id: string) => {
  return api.delete<{ message: string }>(`planillas.php?id=${id}`);
};

