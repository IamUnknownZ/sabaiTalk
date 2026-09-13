import { requireSupabase } from '@/lib/supabase';
import { assertUuid } from '@/lib/validation';
import type { MeetingCategory } from '@/types/domain';

export type MeetingRecommendation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  openNow: boolean | null;
  category: string;
  yourMinutes: number;
  friendMinutes: number;
  fairness: number;
  totalMinutes: number;
};

const meetingCategories = new Set<MeetingCategory>(['cafe', 'food', 'park', 'mall', 'cinema', 'study']);

export async function fetchMeetingRecommendations(matchId: string, category: MeetingCategory) {
  const safeMatchId = assertUuid(matchId, 'match id');
  if (!meetingCategories.has(category)) throw new Error('Invalid meeting category.');

  const { data, error } = await requireSupabase().functions.invoke('meeting-recommendations', {
    body: { matchId: safeMatchId, category },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.places ?? []) as MeetingRecommendation[];
}
