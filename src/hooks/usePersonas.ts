import { useState, useEffect, useCallback } from "react";
import { api } from "../libs/api";
import { Persona, PersonaCharge } from "../types";

export const usePersonas = (planillaId: string) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Persona[]>(`personas.php?planilla_id=${planillaId}`);
      setPersonas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading personas");
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  }, [planillaId]);

  useEffect(() => {
    if (planillaId) fetchPersonas();
  }, [planillaId, fetchPersonas]);

  return { personas, loading, error, refetch: fetchPersonas };
};

export const createPersona = async (persona: {
  planilla_id: string;
  dni: string;
  name: string;
  second_name: string;
  phone_number: string;
  charge: PersonaCharge;
}) => {
  return api.post<{ message: string }>("personas.php", persona);
};

export const updatePersona = async (
  id: string,
  persona: Partial<Omit<Persona, "id" | "planilla_id" | "created_at">>
) => {
  return api.put<{ message: string }>("personas.php", { id, ...persona });
};

export const deletePersona = async (id: string) => {
  return api.delete<{ message: string }>(`personas.php?id=${id}`);
};
