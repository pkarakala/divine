import { supabase } from './supabase';

const GENDER_LIKE_RATE_BASELINES: Record<string, number> = {
  male: 0.053,
  female: 0.444,
  non_binary: 0.15,
};

/**
 * Compute this user's ranking scores for local/preview use.
 *
 * NOTE: user_scores is now service-role-write-only (see
 * supabase/migrations/0001_p0a_rls_hardening.sql, finding M-5) — a user could
 * previously write their own desirability/selectivity scores to game ordering.
 * The authoritative scores are computed and persisted by the `recompute-scores`
 * Edge Function. This function no longer writes to the database; it returns the
 * computed values so callers can use a fresh estimate without a round-trip, and
 * the persisted row is refreshed server-side on the recompute schedule.
 */
export interface ComputedUserScores {
  profile_quality: number;
  response_rate: number;
  activity_score: number;
  desirability_score: number;
  selectivity_score: number;
}

export async function computeAndSaveUserScores(userId: string): Promise<ComputedUserScores> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('gender, last_active_at')
    .eq('id', userId)
    .single();

  const { data: photos } = await supabase
    .from('photos')
    .select('id')
    .eq('user_id', userId);

  const { data: prompts } = await supabase
    .from('prompts')
    .select('id')
    .eq('user_id', userId);

  let profileQuality = 0;
  if (profile?.display_name) profileQuality += 0.1;
  if (profile?.occupation) profileQuality += 0.1;
  if (profile?.bio) profileQuality += 0.1;
  if (profile?.city) profileQuality += 0.1;
  if (profile?.date_of_birth) profileQuality += 0.1;
  if ((photos?.length || 0) >= 2) profileQuality += 0.2;
  if ((photos?.length || 0) >= 4) profileQuality += 0.1;
  if ((prompts?.length || 0) >= 3) profileQuality += 0.2;

  const { count: likesReceived } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .in('type', ['like', 'rose']);

  const { count: passesReceived } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('type', 'pass');

  const totalImpressions = (likesReceived || 0) + (passesReceived || 0);
  const gender = user?.gender || 'male';
  const baseline = GENDER_LIKE_RATE_BASELINES[gender] || 0.053;

  let desirabilityPercentile: number;
  if (totalImpressions < 5) {
    desirabilityPercentile = 0.5 + (profileQuality - 0.5) * 0.3;
  } else {
    const userLikeRate = (likesReceived || 0) / totalImpressions;
    const normalizedRatio = userLikeRate / baseline;
    desirabilityPercentile = 1 / (1 + Math.exp(-Math.log(normalizedRatio + 0.01) * 1.5));
  }

  const { count: likesSent } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .in('type', ['like', 'rose']);

  const { count: passesSent } = await supabase
    .from('interactions')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .eq('type', 'pass');

  const totalSwiped = (likesSent || 0) + (passesSent || 0);
  const selectivity = totalSwiped > 0 ? 1 - (likesSent || 0) / totalSwiped : 0.5;

  const { count: matchesWithMessages } = await supabase
    .from('matches')
    .select('*, messages!inner(id)', { count: 'exact', head: true })
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`);

  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`);

  const responseRate = totalMatches && totalMatches > 0
    ? Math.min(1, (matchesWithMessages || 0) / totalMatches)
    : 0.5;

  const lastActive = user?.last_active_at ? new Date(user.last_active_at) : new Date();
  const hoursSinceActive = (Date.now() - lastActive.getTime()) / 3600000;
  const activityScore = Math.max(0, 1 - hoursSinceActive / 168);

  // Persisting these is the server's job now (recompute-scores Edge Function,
  // service role). RLS would reject a client upsert here.
  return {
    profile_quality: Math.round(profileQuality * 100) / 100,
    response_rate: Math.round(responseRate * 100) / 100,
    activity_score: Math.round(activityScore * 100) / 100,
    desirability_score: Math.round(desirabilityPercentile * 100) / 100,
    selectivity_score: Math.round(selectivity * 100) / 100,
  };
}
