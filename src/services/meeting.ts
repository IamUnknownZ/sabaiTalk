export function calculateFairness(yourMinutes: number, friendMinutes: number) {
  const max = Math.max(yourMinutes, friendMinutes, 1);
  const imbalance = Math.abs(yourMinutes - friendMinutes) / max;
  const totalPenalty = Math.min((yourMinutes + friendMinutes) / 180, 1);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - imbalance * 0.75 - totalPenalty * 0.25))));
}
