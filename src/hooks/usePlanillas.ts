import { useState, useEffect } from 'react';
import { supabase } from '../libs/supabase';
import { Planilla, PlanillaWithDetails } from '../types';

export const usePlanillas = () => {
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanillas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planillas')
        .select('*, team:teams(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  const fetchPlanilla = async () => {
    try {
      setLoading(true);
      const { data: planillaData, error: planillaError } = await supabase
        .from('planillas')
        .select('*, team:teams(*)')
        .eq('id', id)
        .maybeSingle();

      if (planillaError) throw planillaError;
      if (!planillaData) throw new Error('Planilla not found');

      const { data: jugadores, error: jugadoresError } = await supabase
        .from('jugadores')
        .select('*')
        .eq('planilla_id', id)
        .order('number', { ascending: true });

      if (jugadoresError) throw jugadoresError;

      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('*')
        .eq('planilla_id', id)
        .order('charge', { ascending: true });

      if (personasError) throw personasError;

      setPlanilla({
        ...planillaData,
        jugadores: jugadores || [],
        personas: personas || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading planilla');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPlanilla();
    }
  }, [id]);

  return { planilla, loading, error, refetch: fetchPlanilla };
};
