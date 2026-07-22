import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const KEY_PREFIX = 'divine:keys:';

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const pair = nacl.box.keyPair();
  const keys: KeyPair = {
    publicKey: naclUtil.encodeBase64(pair.publicKey),
    secretKey: naclUtil.encodeBase64(pair.secretKey),
  };
  await SecureStore.setItemAsync(`${KEY_PREFIX}public`, keys.publicKey);
  await SecureStore.setItemAsync(`${KEY_PREFIX}secret`, keys.secretKey);
  return keys;
}

export async function getKeyPair(): Promise<KeyPair | null> {
  const publicKey = await SecureStore.getItemAsync(`${KEY_PREFIX}public`);
  const secretKey = await SecureStore.getItemAsync(`${KEY_PREFIX}secret`);
  if (!publicKey || !secretKey) return null;
  return { publicKey, secretKey };
}

export async function getOrCreateKeyPair(): Promise<KeyPair> {
  const existing = await getKeyPair();
  if (existing) return existing;
  return generateKeyPair();
}

export function encryptMessage(
  plaintext: string,
  recipientPublicKey: string,
  senderSecretKey: string
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = naclUtil.decodeUTF8(plaintext);
  const pubKey = naclUtil.decodeBase64(recipientPublicKey);
  const secKey = naclUtil.decodeBase64(senderSecretKey);

  const encrypted = nacl.box(messageBytes, nonce, pubKey, secKey);

  return {
    ciphertext: naclUtil.encodeBase64(encrypted),
    nonce: naclUtil.encodeBase64(nonce),
  };
}

export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: string,
  recipientSecretKey: string
): string | null {
  const cipherBytes = naclUtil.decodeBase64(ciphertext);
  const nonceBytes = naclUtil.decodeBase64(nonce);
  const pubKey = naclUtil.decodeBase64(senderPublicKey);
  const secKey = naclUtil.decodeBase64(recipientSecretKey);

  const decrypted = nacl.box.open(cipherBytes, nonceBytes, pubKey, secKey);
  if (!decrypted) return null;

  return naclUtil.encodeUTF8(decrypted);
}

export async function getSharedKeyForMatch(matchId: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${KEY_PREFIX}shared:${matchId}`);
}

export async function saveSharedKeyForMatch(matchId: string, key: string): Promise<void> {
  await SecureStore.setItemAsync(`${KEY_PREFIX}shared:${matchId}`, key);
}
