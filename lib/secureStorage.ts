import * as SecureStore from 'expo-secure-store';

/**
 * SecureStore-backed storage adapter for Supabase auth (audit M-4): keeps
 * refresh tokens in the iOS Keychain / Android Keystore instead of plaintext
 * AsyncStorage.
 *
 * SecureStore warns above ~2 KB per entry and hard-fails on some Androids, and
 * a Supabase session JSON regularly exceeds that — so values are split into
 * chunks, with a count entry (`<key>.len`) tracking how many to reassemble.
 * SecureStore keys may not contain '@' etc.; Supabase keys are sanitized.
 */
const CHUNK_SIZE = 1800;

function sanitize(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

async function getChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(`${key}.len`);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const secureStorage = {
  getItem: async (rawKey: string): Promise<string | null> => {
    const key = sanitize(rawKey);
    const count = await getChunkCount(key);
    if (count === 0) return null;
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}.${i}`);
      if (chunk === null) return null; // corrupted/partial — treat as absent
      chunks.push(chunk);
    }
    return chunks.join('');
  },

  setItem: async (rawKey: string, value: string): Promise<void> => {
    const key = sanitize(rawKey);
    const oldCount = await getChunkCount(key);
    const newCount = Math.ceil(value.length / CHUNK_SIZE) || 1;
    for (let i = 0; i < newCount; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}.len`, String(newCount));
    for (let i = newCount; i < oldCount; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
  },

  removeItem: async (rawKey: string): Promise<void> => {
    const key = sanitize(rawKey);
    const count = await getChunkCount(key);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}.len`);
  },
};
