import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Profile } from '../types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: any;
  isLoading: boolean;
  isOnboarded: boolean;

  initialize: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  setOnboarded: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isOnboarded: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        set({
          session,
          user: userData,
          profile: profileData,
          isOnboarded: !!profileData?.organization,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }

    // Heartbeat: mark the user active on session start (M-3). The RPC only
    // ever sets NOW() for the caller — last_active_at is not client-writable.
    supabase.rpc('touch_last_active').then(() => {});

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        set({ session });
        await get().fetchProfile();
        supabase.rpc('touch_last_active').then(() => {});
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null, session: null, isOnboarded: false });
      }
    });
  },

  signInWithPhone: async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error?.message || null };
  },

  verifyOtp: async (phone, token) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error: error?.message || null };
  },

  signInWithEmail: async (email, password) => {
    console.log('[auth] signInWithEmail attempt:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[auth] signInWithEmail error:', error.message, error.status);
    } else {
      console.log('[auth] signInWithEmail success, user:', data.user?.id);
      // Set session synchronously and await profile so the store is fully populated
      // before the caller calls router.replace('/') — avoids a race with onAuthStateChange.
      set({ session: data.session });
      await get().fetchProfile();
    }
    return { error: error?.message || null };
  },

  signUpWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message || null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null, isOnboarded: false });
  },

  fetchProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    set({
      user: userData,
      profile: profileData,
      isOnboarded: !!profileData?.organization,
    });
  },

  setProfile: (profile) => set({ profile }),
  setOnboarded: (value) => set({ isOnboarded: value }),
}));
