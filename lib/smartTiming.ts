import { supabase } from './supabase';

export async function recordActivityWindow(userId: string) {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'session_start',
    metadata: { hour, day_of_week: dayOfWeek },
    created_at: new Date().toISOString(),
  });
}

export async function getUserPeakHours(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'session_start')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data || data.length < 5) return [19, 20, 21];

  const hourCounts: Record<number, number> = {};
  data.forEach(event => {
    const hour = (event.metadata as any)?.hour;
    if (hour !== undefined) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  return Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
}

export function isUserLikelyActive(peakHours: number[]): boolean {
  const currentHour = new Date().getHours();
  return peakHours.includes(currentHour);
}

export async function getOptimalNotificationTime(userId: string): Promise<{ hour: number; minute: number }> {
  const peakHours = await getUserPeakHours(userId);
  const targetHour = peakHours[0] || 19;
  return { hour: targetHour, minute: 45 };
}
