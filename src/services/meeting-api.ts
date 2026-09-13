import { requireSupabase } from '@/lib/supabase';
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

export async function fetchMeetingRecommendations(matchId: string, category: MeetingCategory) {
  const { data, error } = await requireSupabase().functions.invoke('meeting-recommendations', {
    body: { matchId, category },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return (data?.places ?? []) as MeetingRecommendation[];
}
