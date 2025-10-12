import { useState, useEffect, useCallback } from 'react';
import { api } from '../libs/api';
import { Planilla, PlanillaWithDetails } from '../types';

export const usePlanillas = () => {
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanillas = async () => {
    try {
      setLoading(true);
      const data = await api.get<Planilla[]>('planillas.php');
      setPlanillas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading planillas');
    } finally {
      console.log("[DEBUG] PLANILLAS:", planillas);
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

  const fetchPlanilla = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<PlanillaWithDetails>(`planillas.php?id=${id}`);
      setPlanilla(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading planilla');
    } finally {
      console.log("[DEBUG] PLANILLA:", planilla);
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

export const createPlanilla = async (planilla: Partial<Planilla>) => {
  return api.post<{ id: string; message: string }>('planillas.php', planilla);
};

export const updatePlanilla = async (id: string, planilla: Partial<Planilla>) => {
  return api.put<{ message: string }>('planillas.php', { ...planilla, id });
};

export const deletePlanilla = async (id: string) => {
  return api.delete<{ message: string }>(`planillas.php?id=${id}`);
};

