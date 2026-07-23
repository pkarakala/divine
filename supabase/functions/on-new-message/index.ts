import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireWebhookSecret } from '../_shared/auth.ts';
import { sendPushMessages } from '../_shared/push.ts';

serve(async (req) => {
  const denied = requireWebhookSecret(req);
  if (denied) return denied;

  const { record } = await req.json();
  const { match_id, sender_id, content, type } = record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: match } = await supabase
    .from('matches')
    .select('user_1_id, user_2_id')
    .eq('id', match_id)
    .single();

  if (!match) return new Response('No match', { status: 404 });

  const receiverId = match.user_1_id === sender_id ? match.user_2_id : match.user_1_id;

  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', sender_id)
    .single();

  const messagePreview = type === 'image' ? '\u{1F4F7} Photo' : content.substring(0, 50);

  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', receiverId);

  if (tokensError) {
    console.error('push_tokens query failed:', tokensError.message);
    return new Response(JSON.stringify({ error: 'token lookup failed' }), { status: 500 });
  }
  if (!tokens?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const result = await sendPushMessages(supabase, tokens.map(t => ({
    to: t.token,
    title: senderProfile?.display_name || 'New message',
    body: messagePreview,
    data: { type: 'message', matchId: match_id },
    sound: 'default',
    badge: 1,
  })));

  return new Response(JSON.stringify(result), { status: 200 });
});
