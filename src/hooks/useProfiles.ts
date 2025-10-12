import { useState, useEffect, useCallback } from 'react';
import { api } from '../libs/api';
import { Profile } from '../types';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await api.get<Profile[]>('profiles.php');
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profiles');
    } finally {
      console.log("[DEBUG] PROFILES:", profiles);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return { profiles, loading, error, refetch: fetchProfiles };
};

export const useProfile = (id: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Profile>(`profiles.php?id=${id}`);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading profile');
    } finally {
      console.log("[DEBUG] PROFILE:", profile);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id, fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

export const createProfile = async (profile: Partial<Profile>) => {
  return api.post<{ message: string }>('profiles.php', profile);
};

export const updateProfile = async (id: string, profile: Partial<Profile>) => {
  return api.put<{ message: string }>('profiles.php', { ...profile, id });
};

export const deleteProfile = async (id: string) => {
  return api.delete<{ message: string }>(`profiles.php?id=${id}`);
};
