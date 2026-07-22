import { supabase } from './supabase';

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('reports')
    .select('reported_id')
    .eq('reporter_id', userId)
    .eq('status', 'actioned');

  const { data: blockedBy } = await supabase
    .from('reports')
    .select('reporter_id')
    .eq('reported_id', userId)
    .eq('status', 'actioned');

  const blocked = new Set<string>();
  data?.forEach(r => blocked.add(r.reported_id));
  blockedBy?.forEach(r => blocked.add(r.reporter_id));

  return Array.from(blocked);
}

export async function isUserBlocked(userId: string, targetId: string): Promise<boolean> {
  const { data } = await supabase
    .from('reports')
    .select('id')
    .or(`and(reporter_id.eq.${userId},reported_id.eq.${targetId}),and(reporter_id.eq.${targetId},reported_id.eq.${userId})`)
    .eq('status', 'actioned')
    .limit(1);

  return (data?.length || 0) > 0;
}
