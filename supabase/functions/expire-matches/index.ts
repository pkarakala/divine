import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date().toISOString();

  // Find expired matches (past expires_at, still active, no messages)
  const { data: expiredMatches } = await supabase
    .from('matches')
    .select('id, user_1_id, user_2_id')
    .eq('status', 'active')
    .lt('expires_at', now);

  if (!expiredMatches?.length) {
    return new Response(JSON.stringify({ expired: 0 }), { status: 200 });
  }

  // Check which ones have no messages
  let expired = 0;
  for (const match of expiredMatches) {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', match.id);

    if (!count || count === 0) {
      await supabase
        .from('matches')
        .update({ status: 'expired' })
        .eq('id', match.id);
      expired++;
    }
  }

  return new Response(JSON.stringify({ expired, checked: expiredMatches.length }), { status: 200 });
});
