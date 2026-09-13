import { requireSupabase } from '@/lib/supabase';

export async function blockProfile(targetUserId: string) {
  const { error } = await requireSupabase().rpc('block_profile', { target_user: targetUserId });
  if (error) throw error;
}

export async function reportProfile(targetUserId: string, reason: string, details?: string) {
  const client = requireSupabase();
  const { data } = await client.auth.getSession();
  const reporterId = data.session?.user.id;
  if (!reporterId) throw new Error('Not signed in.');

  const { error } = await client.from('reports').insert({
    reporter_id: reporterId,
    reported_id: targetUserId,
    reason,
    details: details?.trim() || null,
  });

  if (error) throw error;
}
