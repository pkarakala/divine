import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireWebhookSecret } from '../_shared/auth.ts';
import { sendPushMessages } from '../_shared/push.ts';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // C-5: this endpoint sends pushes to ANY user with arbitrary content using
  // the service role — only trusted server-side callers may invoke it.
  const denied = requireWebhookSecret(req);
  if (denied) return denied;

  const { userId, title, body, data } = await req.json() as NotificationPayload;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: tokens, error: tokensError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (tokensError) {
    console.error('push_tokens query failed:', tokensError.message);
    return new Response(JSON.stringify({ error: 'token lookup failed' }), { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const result = await sendPushMessages(supabase, tokens.map(t => ({
    to: t.token,
    title,
    body,
    data: data || {},
    sound: 'default',
    badge: 1,
  })));

  return new Response(JSON.stringify(result), { status: 200 });
});
