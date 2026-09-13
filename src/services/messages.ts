import { requireSupabase } from '@/lib/supabase';
import { assertUuid, normalizeRequiredText } from '@/lib/validation';

export async function listMessages(matchId: string) {
  const safeMatchId = assertUuid(matchId, 'match id');
  const { data, error } = await requireSupabase()
    .from('messages')
    .select('id,match_id,sender_id,content,created_at,read_at')
    .eq('match_id', safeMatchId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(matchId: string, content: string) {
  const safeMatchId = assertUuid(matchId, 'match id');
  const trimmed = normalizeRequiredText(content, 'Message', 2000);
  const client = requireSupabase();

  const { data: sessionData } = await client.auth.getSession();
  const senderId = sessionData.session?.user.id;
  if (!senderId) throw new Error('Not signed in.');

  const { data, error } = await client
    .from('messages')
    .insert({
      match_id: safeMatchId,
      sender_id: senderId,
      content: trimmed,
    })
    .select('id,match_id,sender_id,content,created_at,read_at')
    .single();

  if (error) throw error;
  return data;
}

export function subscribeToMessages(matchId: string, onInsert: (message: Record<string, unknown>) => void) {
  const safeMatchId = assertUuid(matchId, 'match id');
  const client = requireSupabase();
  const channel = client
    .channel(`messages:${safeMatchId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${safeMatchId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
