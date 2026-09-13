import { requireSupabase } from '@/lib/supabase';
import { assertUuid, normalizeOptionalText } from '@/lib/validation';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'safety' | 'other';

const reportReasons = new Set<ReportReason>(['spam', 'harassment', 'inappropriate', 'fake', 'safety', 'other']);

export async function blockProfile(targetUserId: string) {
  const targetUser = assertUuid(targetUserId, 'profile id');
  const { error } = await requireSupabase().rpc('block_profile', { target_user: targetUser });
  if (error) throw error;
}

export async function reportProfile(targetUserId: string, reason: ReportReason, details?: string) {
  const targetUser = assertUuid(targetUserId, 'profile id');
  if (!reportReasons.has(reason)) throw new Error('Invalid report reason.');
  const normalizedDetails = normalizeOptionalText(details, 1000);

  const { error } = await requireSupabase().rpc('report_profile', {
    target_user: targetUser,
    report_reason: reason,
    report_details: normalizedDetails,
  });

  if (error) throw error;
}
