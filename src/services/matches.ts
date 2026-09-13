import { requireSupabase } from '@/lib/supabase';

export type MatchSummaryRow = {
  match_id: string;
  other_user_id: string;
  display_name: string;
  avatar_url: string | null;
  approximate_area: string | null;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
};

export async function fetchMyMatches() {
  const { data, error } = await requireSupabase().rpc('my_matches');
  if (error) throw error;
  return (data ?? []) as MatchSummaryRow[];
}
