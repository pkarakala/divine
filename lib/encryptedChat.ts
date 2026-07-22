import { supabase } from './supabase';
import {
  getOrCreateKeyPair,
  encryptMessage,
  decryptMessage,
  KeyPair,
} from './encryption';

export async function publishPublicKey(userId: string): Promise<string> {
  const keys = await getOrCreateKeyPair();

  await supabase
    .from('users')
    .update({ public_key: keys.publicKey })
    .eq('id', userId);

  return keys.publicKey;
}

export async function getRecipientPublicKey(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('public_key')
    .eq('id', userId)
    .single();

  return data?.public_key || null;
}

export async function encryptAndSendMessage(
  matchId: string,
  senderId: string,
  recipientId: string,
  plaintext: string,
  type: 'text' | 'image' = 'text',
  mediaUrl?: string
): Promise<{ success: boolean; messageId?: string }> {
  const keys = await getOrCreateKeyPair();
  const recipientPubKey = await getRecipientPublicKey(recipientId);

  let content: string;

  if (recipientPubKey) {
    const { ciphertext, nonce } = encryptMessage(plaintext, recipientPubKey, keys.secretKey);
    content = JSON.stringify({ c: ciphertext, n: nonce, e: true });
  } else {
    content = plaintext;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
      type,
      media_url: mediaUrl || null,
    })
    .select()
    .single();

  if (error) return { success: false };
  return { success: true, messageId: data.id };
}

export async function decryptReceivedMessage(
  content: string,
  senderUserId: string
): Promise<string> {
  try {
    const parsed = JSON.parse(content);
    if (!parsed.e) return content;

    const keys = await getOrCreateKeyPair();
    const senderPubKey = await getRecipientPublicKey(senderUserId);

    if (!senderPubKey) return '[Encrypted message]';

    const decrypted = decryptMessage(parsed.c, parsed.n, senderPubKey, keys.secretKey);
    return decrypted || '[Unable to decrypt]';
  } catch {
    return content;
  }
}
