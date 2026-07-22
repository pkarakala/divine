import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get all users active in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
  const { data: activeUsers } = await supabase
    .from('users')
    .select('id, gender, last_active_at')
    .gte('last_active_at', sevenDaysAgo);

  if (!activeUsers) return new Response(JSON.stringify({ processed: 0 }), { status: 200 });

  const GENDER_BASELINES: Record<string, number> = {
    male: 0.053,
    female: 0.444,
    non_binary: 0.15,
  };

  let processed = 0;

  for (const user of activeUsers) {
    const { data: photos } = await supabase.from('photos').select('id').eq('user_id', user.id);
    const { data: prompts } = await supabase.from('prompts').select('id').eq('user_id', user.id);
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();

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
      .eq('receiver_id', user.id)
      .in('type', ['like', 'rose']);

    const { count: passesReceived } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('type', 'pass');

    const totalImpressions = (likesReceived || 0) + (passesReceived || 0);
    const baseline = GENDER_BASELINES[user.gender || 'male'] || 0.053;

    let desirability: number;
    if (totalImpressions < 5) {
      desirability = 0.5 + (profileQuality - 0.5) * 0.3;
    } else {
      const likeRate = (likesReceived || 0) / totalImpressions;
      const ratio = likeRate / baseline;
      desirability = 1 / (1 + Math.exp(-Math.log(ratio + 0.01) * 1.5));
    }

    const { count: likesSent } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .in('type', ['like', 'rose']);

    const { count: passesSent } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .eq('type', 'pass');

    const totalSwiped = (likesSent || 0) + (passesSent || 0);
    const selectivity = totalSwiped > 0 ? 1 - (likesSent || 0) / totalSwiped : 0.5;

    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

    const responseRate = (likesReceived || 0) > 0
      ? Math.min(1, (totalMatches || 0) / (likesReceived || 1))
      : 0.5;

    const lastActive = user.last_active_at ? new Date(user.last_active_at) : new Date();
    const hoursSince = (Date.now() - lastActive.getTime()) / 3600000;
    const activityScore = Math.max(0, 1 - hoursSince / 168);

    await supabase.from('user_scores').upsert({
      user_id: user.id,
      profile_quality: Math.round(profileQuality * 100) / 100,
      response_rate: Math.round(responseRate * 100) / 100,
      activity_score: Math.round(activityScore * 100) / 100,
      desirability_score: Math.round(desirability * 100) / 100,
      selectivity_score: Math.round(selectivity * 100) / 100,
      updated_at: new Date().toISOString(),
    });

    processed++;
  }

  return new Response(JSON.stringify({ processed }), { status: 200 });
});
