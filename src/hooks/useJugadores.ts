import { useState, useEffect, useCallback } from "react";
import { api } from "../libs/api";
import { Jugador } from "../types";

// Hook para obtener todos los jugadores de una planilla
export const useJugadores = (planillaId: string) => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJugadores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Jugador[]>(`jugadores.php?planilla_id=${planillaId}`);
      setJugadores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading jugadores");
      setJugadores([]);
    } finally {
      setLoading(false);
    }
  }, [planillaId]);

  useEffect(() => {
    if (planillaId) fetchJugadores();
  }, [planillaId, fetchJugadores]);

  return { jugadores, loading, error, refetch: fetchJugadores };
};

// Crear un jugador
export const createJugador = async (jugador: {
  planilla_id: string;
  dni: string;
  name: string;
  second_name: string;
  number?: number;
}) => {
  return api.post<{ message: string }>("jugadores.php", {
    ...jugador,
    number: jugador.number ?? 0,
  });
};

// Modificar un jugador
export const updateJugador = async (
  id: string,
  jugador: Partial<Omit<Jugador, "id" | "planilla_id" | "created_at">>
) => {
  return api.put<{ message: string }>("jugadores.php", { id, ...jugador });
};

// Eliminar un jugador
export const deleteJugador = async (id: string) => {
  return api.delete<{ message: string }>(`jugadores.php?id=${id}`);
};
