const actionTimestamps: Record<string, number[]> = {};

export function isRateLimited(action: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const timestamps = actionTimestamps[action] || [];

  const recent = timestamps.filter(t => now - t < 60000);
  actionTimestamps[action] = recent;

  if (recent.length >= maxPerMinute) {
    return true;
  }

  recent.push(now);
  return false;
}

export function recordAction(action: string) {
  if (!actionTimestamps[action]) actionTimestamps[action] = [];
  actionTimestamps[action].push(Date.now());
}
