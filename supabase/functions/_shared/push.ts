/**
 * Shared Expo push sending with error handling + dead-token pruning (L-5).
 *
 * - Checks the Expo push API response instead of ignoring it.
 * - Tickets that come back DeviceNotRegistered mean the token is dead
 *   (app uninstalled / token rotated): prune it from push_tokens so we
 *   stop paying for sends that never arrive.
 * - Logs failures so they're visible in function logs.
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

export async function sendPushMessages(
  supabase: SupabaseClient,
  messages: PushMessage[],
): Promise<{ sent: number; pruned: number }> {
  if (messages.length === 0) return { sent: 0, pruned: 0 };

  let tickets: Array<{ status: string; details?: { error?: string } }> = [];
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!response.ok) {
      console.error(`expo push HTTP ${response.status}: ${await response.text()}`);
      return { sent: 0, pruned: 0 };
    }
    const json = await response.json();
    tickets = json.data ?? [];
  } catch (e) {
    console.error('expo push request failed:', e);
    return { sent: 0, pruned: 0 };
  }

  let sent = 0;
  const deadTokens: string[] = [];
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'ok') {
      sent++;
    } else {
      console.error(`push ticket error for ${messages[i]?.to}:`, JSON.stringify(ticket));
      if (ticket.details?.error === 'DeviceNotRegistered' && messages[i]?.to) {
        deadTokens.push(messages[i].to);
      }
    }
  });

  if (deadTokens.length > 0) {
    const { error } = await supabase.from('push_tokens').delete().in('token', deadTokens);
    if (error) console.error('failed to prune dead tokens:', error.message);
    else console.log(`pruned ${deadTokens.length} dead push token(s)`);
  }

  return { sent, pruned: deadTokens.length };
}
