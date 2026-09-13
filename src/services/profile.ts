import { requireSupabase } from '@/lib/supabase';

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

  const { error } = await client.from('profiles').upsert({
    id,
    display_name: input.displayName.trim(),
    bio: input.bio.trim(),
    approximate_area: input.approximateArea ?? null,
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
  const client = requireSupabase();
  const userId = await currentUserId();

  const { data: rows, error: lookupError } = await client
    .from('interests')
    .select('id,slug')
    .in('slug', slugs);

  if (lookupError) throw lookupError;
  if ((rows ?? []).length !== slugs.length) {
    throw new Error('One or more selected interests are unavailable.');
  }

  const { error: deleteError } = await client
    .from('user_interests')
    .delete()
    .eq('user_id', userId);

  if (deleteError) throw deleteError;

  const { error: insertError } = await client
    .from('user_interests')
    .insert((rows ?? []).map((row) => ({ user_id: userId, interest_id: row.id })));

  if (insertError) throw insertError;
}

export async function fetchMyProfile() {
  return fetchPublicProfile(await currentUserId());
}

export async function fetchPublicProfile(userId: string) {
  const client = requireSupabase();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id,display_name,bio,avatar_url,approximate_area,last_active_at')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const { data: links, error: interestsError } = await client
    .from('user_interests')
    .select('interests(slug,label,emoji)')
    .eq('user_id', userId);

  if (interestsError) throw interestsError;

  return {
    ...profile,
    interests: (links ?? []).flatMap((link: any) => link.interests ? [link.interests] : []),
  };
}
