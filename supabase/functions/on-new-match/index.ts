import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireWebhookSecret } from '../_shared/auth.ts';
import { sendPushMessages } from '../_shared/push.ts';

serve(async (req) => {
  const denied = requireWebhookSecret(req);
  if (denied) return denied;

  const { record } = await req.json();
  const { user_1_id, user_2_id } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const [{ data: profile1 }, { data: profile2 }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('user_id', user_1_id).single(),
    supabase.from('profiles').select('display_name').eq('user_id', user_2_id).single(),
  ]);

  const sendNotification = async (userId: string, otherName: string) => {
    const { data: tokens, error } = await supabase.from('push_tokens').select('token').eq('user_id', userId);
    if (error) {
      console.error('push_tokens query failed:', error.message);
      return;
    }
    if (!tokens?.length) return;

    await sendPushMessages(supabase, tokens.map(t => ({
      to: t.token,
      title: "It's a Match! \u{1F389}",
      body: `You and ${otherName} liked each other!`,
      data: { type: 'match', matchId: record.id },
      sound: 'default',
    })));
  };

  await Promise.all([
    sendNotification(user_1_id, profile2?.display_name || 'Someone'),
    sendNotification(user_2_id, profile1?.display_name || 'Someone'),
  ]);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
