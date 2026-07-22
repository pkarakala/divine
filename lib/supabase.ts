import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isServer = typeof window === 'undefined';

const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        if (isServer) return null;
        return window.localStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (!isServer) window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        if (!isServer) window.localStorage.removeItem(key);
      },
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: isServer ? undefined as any : WebSocket,
  },
});
