import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireWebhookSecret } from '../_shared/auth.ts';

serve(async (req) => {
  const denied = requireWebhookSecret(req);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date().toISOString();

  // Find expired matches (past expires_at, still active, no messages)
  const { data: expiredMatches, error: findError } = await supabase
    .from('matches')
    .select('id, user_1_id, user_2_id')
    .eq('status', 'active')
    .lt('expires_at', now);

  if (findError) {
    console.error('expired-match query failed:', findError.message);
    return new Response(JSON.stringify({ error: 'query failed' }), { status: 500 });
  }
  if (!expiredMatches?.length) {
    return new Response(JSON.stringify({ expired: 0 }), { status: 200 });
  }

  // Check which ones have no messages
  let expired = 0;
  let failures = 0;
  for (const match of expiredMatches) {
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', match.id);

    if (countError) {
      console.error(`message count failed for match ${match.id}:`, countError.message);
      failures++;
      continue;
    }

    if (!count || count === 0) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'expired' })
        .eq('id', match.id);
      if (updateError) {
        console.error(`expire failed for match ${match.id}:`, updateError.message);
        failures++;
      } else {
        expired++;
      }
    }
  }

  return new Response(JSON.stringify({ expired, failures, checked: expiredMatches.length }), { status: 200 });
});
