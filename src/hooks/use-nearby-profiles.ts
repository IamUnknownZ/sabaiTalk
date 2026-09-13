import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types/domain';
import { fetchNearbyProfiles } from '@/services/social';

const fallbackAvatar = require('../../assets/branding/logo-mark.png');

export function useNearbyProfiles(radiusKm: number) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

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
      })
      .catch((cause) => {
        if (cancelled) return;
        setProfiles([]);
        setError(cause instanceof Error ? cause.message : 'Could not load nearby profiles.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [radiusKm]);

  return { profiles, loading, error };
}
