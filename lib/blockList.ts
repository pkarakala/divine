import { supabase } from './supabase';

/**
 * Blocking is server-enforced now (supabase/migrations/0003_p0c_blocks.sql,
 * finding C-4): the `blocks` table + `is_blocked_pair()` are checked inside
 * the match trigger, the messages/interactions INSERT policies, and the
 * profiles_discovery view. These helpers only read the user's OWN blocks for
 * client-side UX filtering (hiding stale cached content) — by design a user
 * can never see who blocked them, so the blocked-by direction is invisible
 * here and enforced purely server-side.
 */

export async function blockUser(blockerId: string, blockedId: string): Promise<boolean> {
  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  // 23505 = unique_violation: already blocked, treat as success.
  return !error || error.code === '23505';
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
}

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);

  return data?.map(b => b.blocked_id) || [];
}

export async function isUserBlocked(userId: string, targetId: string): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', userId)
    .eq('blocked_id', targetId)
    .limit(1);

  return (data?.length || 0) > 0;
}
