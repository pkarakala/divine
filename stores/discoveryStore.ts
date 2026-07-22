import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile, Photo, Prompt, InteractionType } from '../types/database';

export interface DiscoveryProfile {
  profile: Profile;
  photos: Photo[];
  prompts: Prompt[];
}

interface DiscoveryState {
  profiles: DiscoveryProfile[];
  currentIndex: number;
  dailyLikesRemaining: number;
  isLoading: boolean;

  fetchProfiles: (userId: string) => Promise<void>;
  interact: (senderId: string, receiverId: string, type: InteractionType, targetType: 'photo' | 'prompt', targetId: string, comment?: string) => Promise<{ matched: boolean }>;
  nextProfile: () => void;
  resetDailyLikes: () => void;
}

const DAILY_LIKE_LIMIT = 8;

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  profiles: [],
  currentIndex: 0,
  dailyLikesRemaining: DAILY_LIKE_LIMIT,
  isLoading: false,

  fetchProfiles: async (userId) => {
    set({ isLoading: true });

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!myProfile) {
      set({ isLoading: false });
      return;
    }

    const { data: existingInteractions } = await supabase
      .from('interactions')
      .select('receiver_id')
      .eq('sender_id', userId);

    const excludeIds = [userId, ...(existingInteractions?.map(i => i.receiver_id) || [])];

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_verified', true)
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .limit(20);

    const { data: user } = await supabase
      .from('users')
      .select('looking_for')
      .eq('id', userId)
      .single();

    if (user?.looking_for && user.looking_for !== 'everyone') {
      query = query.eq('gender', user.looking_for);
    }

    const { data: profiles } = await query;

    if (!profiles || profiles.length === 0) {
      set({ profiles: [], isLoading: false });
      return;
    }

    const discoveryProfiles: DiscoveryProfile[] = await Promise.all(
      profiles.map(async (profile) => {
        const [photosRes, promptsRes] = await Promise.all([
          supabase.from('photos').select('*').eq('user_id', profile.user_id).order('order_index'),
          supabase.from('prompts').select('*').eq('user_id', profile.user_id).order('order_index'),
        ]);
        return {
          profile,
          photos: photosRes.data || [],
          prompts: promptsRes.data || [],
        };
      })
    );

    set({ profiles: discoveryProfiles, currentIndex: 0, isLoading: false });
  },

  interact: async (senderId, receiverId, type, targetType, targetId, comment) => {
    if (type === 'like' || type === 'rose') {
      const remaining = get().dailyLikesRemaining;
      if (remaining <= 0) {
        return { matched: false };
      }
      set({ dailyLikesRemaining: remaining - 1 });
    }

    await supabase.from('interactions').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      type,
      target_type: targetType,
      target_id: targetId,
      comment: comment || null,
    });

    if (type === 'like' || type === 'rose') {
      const { data: reciprocal } = await supabase
        .from('interactions')
        .select('*')
        .eq('sender_id', receiverId)
        .eq('receiver_id', senderId)
        .in('type', ['like', 'rose'])
        .single();

      if (reciprocal) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase.from('matches').insert({
          user_1_id: senderId,
          user_2_id: receiverId,
          expires_at: expiresAt.toISOString(),
          status: 'active',
        });

        return { matched: true };
      }
    }

    return { matched: false };
  },

  nextProfile: () => {
    set({ currentIndex: get().currentIndex + 1 });
  },

  resetDailyLikes: () => {
    set({ dailyLikesRemaining: DAILY_LIKE_LIMIT });
  },
}));
