import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('session_token');

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost/apis'}/manage_users.php`;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const response = await fetch(baseUrl, { headers });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading users');
      setUsers([]);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (email: string, password: string, username: string, isAdmin: boolean) => {
    try {
      const headers = getAuthHeaders();

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password, username, is_admin: isAdmin }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create user');
      }

      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al crear usuario',
      };
    }
  };

  const updateUser = async (userId: string, username: string, isAdmin: boolean) => {
    try {
      const headers = getAuthHeaders();

      const response = await fetch(`${baseUrl}/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ username, is_admin: isAdmin }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update user');
      }

      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al actualizar usuario',
      };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const headers = getAuthHeaders();

      const response = await fetch(`${baseUrl}/${userId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete user');
      }

      await fetchUsers();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar usuario',
      };
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
