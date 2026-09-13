import { requireSupabase } from '@/lib/supabase';

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
  const { error } = await requireSupabase().rpc('set_my_location', { lat: latitude, lng: longitude });
  if (error) throw error;
}

export async function fetchNearbyProfiles(radiusKm: number): Promise<NearbyProfileRow[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc('nearby_profiles', {
    radius_meters: Math.round(radiusKm * 1000),
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
  const { data, error } = await requireSupabase().rpc('like_profile', { target_user: targetUserId });
  if (error) throw error;
  return data as string | null;
}

export async function passProfile(targetUserId: string) {
  const { error } = await requireSupabase().rpc('pass_profile', { target_user: targetUserId });
  if (error) throw error;
}

export async function listMyMatches() {
  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not signed in.');

  const { data, error } = await client
    .from('matches')
    .select('id,user_a,user_b,status,created_at')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
