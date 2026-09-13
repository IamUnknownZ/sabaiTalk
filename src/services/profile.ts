import { requireSupabase } from '@/lib/supabase';
import {
  assertUuid,
  normalizeOptionalText,
  normalizeRequiredText,
  validateInterestSlugs,
} from '@/lib/validation';

async function currentUserId() {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in.');
  return id;
}

export async function upsertMyProfile(input: { displayName: string; bio: string; approximateArea?: string }) {
  const client = requireSupabase();
  const id = await currentUserId();
  const displayName = normalizeRequiredText(input.displayName, 'Display name', 60);
  const bio = normalizeRequiredText(input.bio, 'Bio', 160);
  const approximateArea = normalizeOptionalText(input.approximateArea, 120);

  const { error } = await client.from('profiles').upsert({
    id,
    display_name: displayName,
    bio,
    approximate_area: approximateArea,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function fetchInterestCatalog() {
  const { data, error } = await requireSupabase()
    .from('interests')
    .select('slug,label,emoji')
    .order('label', { ascending: true });

  if (error) throw error;
  return (data ?? []) as { slug: string; label: string; emoji: string | null }[];
}

export async function saveMyInterests(slugs: string[]) {
  const selectedSlugs = validateInterestSlugs(slugs);
  const { error } = await requireSupabase().rpc('set_my_interests', {
    selected_slugs: selectedSlugs,
  });
  if (error) throw error;
}

export async function getMyOnboardingStatus() {
  const { data, error } = await requireSupabase().rpc('my_onboarding_status');
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Could not verify onboarding status.');

  return {
    profileComplete: Boolean(row.profile_complete),
    interestCount: Number(row.interest_count ?? 0),
    hasLocation: Boolean(row.has_location),
  };
}

export async function fetchMyProfile() {
  return fetchPublicProfile(await currentUserId());
}

export async function fetchPublicProfile(userId: string) {
  const safeUserId = assertUuid(userId, 'profile id');
  const client = requireSupabase();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id,display_name,bio,avatar_url,approximate_area,last_active_at')
    .eq('id', safeUserId)
    .single();

  if (profileError) throw profileError;

  const { data: links, error: interestsError } = await client
    .from('user_interests')
    .select('interests(slug,label,emoji)')
    .eq('user_id', safeUserId);

  if (interestsError) throw interestsError;

  return {
    ...profile,
    interests: (links ?? []).flatMap((link: any) => link.interests ? [link.interests] : []),
  };
}
