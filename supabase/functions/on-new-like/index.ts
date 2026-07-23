import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireWebhookSecret } from '../_shared/auth.ts';
import { sendPushMessages } from '../_shared/push.ts';

serve(async (req) => {
  const denied = requireWebhookSecret(req);
  if (denied) return denied;

  const { record } = await req.json();
  const { sender_id, receiver_id, type } = record;

  if (type === 'pass') return new Response('skip', { status: 200 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', sender_id)
    .single();

  const title = type === 'rose' ? 'Someone sent you a rose! \u{1F339}' : 'Someone likes you! ♥';
  const body = `${senderProfile?.display_name || 'Someone'} is interested in you`;

  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', receiver_id);

  if (tokensError) {
    console.error('push_tokens query failed:', tokensError.message);
    return new Response(JSON.stringify({ error: 'token lookup failed' }), { status: 500 });
  }
  if (!tokens?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const result = await sendPushMessages(supabase, tokens.map(t => ({
    to: t.token,
    title,
    body,
    data: { type: 'like' },
    sound: 'default',
  })));

  return new Response(JSON.stringify(result), { status: 200 });
});
