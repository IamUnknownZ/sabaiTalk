import { requireSupabase } from '@/lib/supabase';
import { assertUuid } from '@/lib/validation';

export type NearbyProfileRow = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  approximate_area: string | null;
  distance_meters: number;
  last_active_at: string;
  interests: { slug: string; label: string; emoji: string | null }[];
};

export async function saveMyLocation(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Invalid location.');
  }
  const { error } = await requireSupabase().rpc('set_my_location', { lat: latitude, lng: longitude });
  if (error) throw error;
}

export async function fetchNearbyProfiles(radiusKm: number): Promise<NearbyProfileRow[]> {
  if (!Number.isFinite(radiusKm)) throw new Error('Invalid discovery radius.');
  const safeRadiusKm = Math.min(50, Math.max(0.1, radiusKm));
  const client = requireSupabase();
  const { data, error } = await client.rpc('nearby_profiles', {
    radius_meters: Math.round(safeRadiusKm * 1000),
    result_limit: 50,
  });
  if (error) throw error;

  const rows = (data ?? []) as Omit<NearbyProfileRow, 'interests'>[];
  if (!rows.length) return [];

  const { data: links, error: interestsError } = await client
    .from('user_interests')
    .select('user_id, interests(slug,label,emoji)')
    .in('user_id', rows.map((row) => row.id));

  if (interestsError) throw interestsError;

  return rows.map((row) => ({
    ...row,
    interests: (links ?? [])
      .filter((link: any) => link.user_id === row.id)
      .flatMap((link: any) => link.interests ? [link.interests] : []),
  }));
}

export async function likeProfile(targetUserId: string) {
  const targetUser = assertUuid(targetUserId, 'profile id');
  const { data, error } = await requireSupabase().rpc('like_profile', { target_user: targetUser });
  if (error) throw error;
  return data as string | null;
}

export async function passProfile(targetUserId: string) {
  const targetUser = assertUuid(targetUserId, 'profile id');
  const { error } = await requireSupabase().rpc('pass_profile', { target_user: targetUser });
  if (error) throw error;
}
