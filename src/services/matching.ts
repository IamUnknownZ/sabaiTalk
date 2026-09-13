import type { UserProfile } from '@/types/domain';

export type MatchBreakdown = { interest: number; distance: number; activity: number; total: number };

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function calculateMatchScore(viewerInterestIds: string[], candidate: UserProfile, radiusKm = 10): MatchBreakdown {
  const candidateIds = candidate.interests.map((interest) => interest.id);
  const union = new Set([...viewerInterestIds, ...candidateIds]);
  const shared = candidateIds.filter((id) => viewerInterestIds.includes(id));
  const interest = union.size === 0 ? 0 : (shared.length / union.size) * 100;
  const distance = clamp((1 - candidate.distanceKm / Math.max(radiusKm, 0.1)) * 100);
  const activity = clamp(100 - candidate.lastActiveMinutes * 1.5);
  const total = interest * 0.55 + distance * 0.3 + activity * 0.15;
  return { interest: Math.round(interest), distance: Math.round(distance), activity: Math.round(activity), total: Math.round(clamp(total)) };
}
