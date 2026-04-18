/** User considered online if lastSeenAt is within this window (ms). */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export function computeIsOnline(lastSeenAt?: Date | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}
