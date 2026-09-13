import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types/domain';
import { mockProfiles } from '@/data/mock-data';
import { hasSupabaseConfig } from '@/lib/env';
import { fetchNearbyProfiles } from '@/services/social';

const fallbackAvatar = require('../../assets/branding/logo-mark.png');

export function useNearbyProfiles(radiusKm: number) {
  const [profiles, setProfiles] = useState<UserProfile[]>(hasSupabaseConfig ? [] : mockProfiles.filter((item) => item.distanceKm <= radiusKm));
  const [loading, setLoading] = useState(false);
  const [usingDemo, setUsingDemo] = useState(!hasSupabaseConfig);

  useEffect(() => {
    let cancelled = false;

    if (!hasSupabaseConfig) {
      setProfiles(mockProfiles.filter((item) => item.distanceKm <= radiusKm));
      setUsingDemo(true);
      return;
    }

    setLoading(true);
    fetchNearbyProfiles(radiusKm)
      .then((rows) => {
        if (cancelled) return;
        setProfiles(rows.map((row) => ({
          id: row.id,
          displayName: row.display_name,
          bio: row.bio,
          avatar: row.avatar_url ? { uri: row.avatar_url } : fallbackAvatar,
          distanceKm: row.distance_meters / 1000,
          approximateArea: row.approximate_area || 'Nearby area',
          lastActiveMinutes: Math.max(0, Math.round((Date.now() - new Date(row.last_active_at).getTime()) / 60000)),
          interests: row.interests.map((interest) => ({
            id: interest.slug,
            label: interest.label,
            emoji: interest.emoji || '✨',
          })),
        })));
        setUsingDemo(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfiles([]);
        setUsingDemo(false);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [radiusKm]);

  return { profiles, loading, usingDemo };
}
