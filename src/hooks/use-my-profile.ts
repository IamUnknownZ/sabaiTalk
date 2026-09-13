import { useCallback, useEffect, useState } from 'react';
import { fetchMyProfile } from '@/services/profile';

export type MyProfile = Awaited<ReturnType<typeof fetchMyProfile>>;

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await fetchMyProfile());
    } catch (cause) {
      setProfile(null);
      setError(cause instanceof Error ? cause.message : 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, reload: load };
}
