import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { rankProfiles } from '../lib/scoring';
import { computeAndSaveUserScores } from '../lib/computeUserScores';
import { applyActivityMultipliers } from '../lib/activityFilter';
import { getUserPeakHours, isUserLikelyActive } from '../lib/smartTiming';
import { prefetchProfileImages } from '../lib/imagePrefetch';
import { saveDiscoveryPosition, getDiscoveryPosition } from '../lib/statePersistence';
import { isRateLimited } from '../lib/rateLimit';
import { getVariant } from '../lib/experiments';
import { getBlockedUserIds } from '../lib/blockList';
import type { Profile, Photo, Prompt, InteractionType } from '../types/database';

export interface DiscoveryProfile {
  profile: Profile;
  photos: Photo[];
  prompts: Prompt[];
  last_active_at?: string;
  compatibilityScore?: number;
}

interface DiscoveryState {
  profiles: DiscoveryProfile[];
  currentIndex: number;
  dailyLikesRemaining: number;
  isLoading: boolean;

  fetchProfiles: (userId: string) => Promise<void>;
  interact: (senderId: string, receiverId: string, type: InteractionType, targetType: 'photo' | 'prompt', targetId: string, comment?: string) => Promise<{ matched: boolean }>;
  nextProfile: () => void;
  previousProfile: () => void;
  deleteLastPass: (senderId: string, receiverId: string) => Promise<void>;
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

    const likeLimitVariant = await getVariant('daily_likes_limit');
    const limit = likeLimitVariant === '5_likes' ? 5 : likeLimitVariant === '12_likes' ? 12 : 8;

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

    const blockedIds = await getBlockedUserIds(userId);
    const excludeIds = [userId, ...(existingInteractions?.map(i => i.receiver_id) || []), ...blockedIds];

    let query = supabase
      .from('profiles')
      .select('*')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .limit(20);

    const { data: profiles } = await query;

    if (!profiles || profiles.length === 0) {
      set({ profiles: [], isLoading: false });
      return;
    }

    const userIds = profiles.map(p => p.user_id);
    const { data: usersData } = await supabase
      .from('users')
      .select('id, last_active_at')
      .in('id', userIds);

    const activityMap = new Map<string, string>();
    usersData?.forEach(u => {
      if (u.last_active_at) activityMap.set(u.id, u.last_active_at);
    });

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
          last_active_at: activityMap.get(profile.user_id),
        };
      })
    );

    await computeAndSaveUserScores(userId);

    const ranked = await rankProfiles(userId, myProfile, userIds);

    const baseScored = ranked.map(r => ({
      userId: r.userId,
      score: r.score,
      lastActiveAt: activityMap.get(r.userId) || null,
    }));

    const activityScored = applyActivityMultipliers(baseScored);

    const peakHoursMap = new Map<string, number[]>();
    await Promise.all(
      activityScored.map(async (entry) => {
        const peaks = await getUserPeakHours(entry.userId);
        peakHoursMap.set(entry.userId, peaks);
      })
    );

    const finalScored = activityScored.map(entry => {
      const peaks = peakHoursMap.get(entry.userId) || [19, 20, 21];
      const timingBoost = isUserLikelyActive(peaks) ? 5 : 0;
      return { ...entry, score: entry.score + timingBoost };
    });

    finalScored.sort((a, b) => b.score - a.score);

    const highlyActiveIds = new Set(
      finalScored
        .filter(e => e.activityTier === 'highly_active')
        .map(e => e.userId)
    );

    const nonHighlyActive = finalScored.filter(e => !highlyActiveIds.has(e.userId));
    const highlyActive = finalScored.filter(e => highlyActiveIds.has(e.userId));

    const merged: typeof finalScored = [];
    let haInserted = 0;
    let naIdx = 0;

    for (let i = 0; merged.length < finalScored.length; i++) {
      if (haInserted < highlyActive.length && i >= 1 && i <= 5) {
        merged.push(highlyActive[haInserted]);
        haInserted++;
      } else if (naIdx < nonHighlyActive.length) {
        merged.push(nonHighlyActive[naIdx]);
        naIdx++;
      } else if (haInserted < highlyActive.length) {
        merged.push(highlyActive[haInserted]);
        haInserted++;
      }
    }

    const scoreMap = new Map(merged.map(e => [e.userId, e.score]));
    const profileMap = new Map(discoveryProfiles.map(dp => [dp.profile.user_id, dp]));
    const rankedProfiles = merged
      .map(e => profileMap.get(e.userId))
      .filter((dp): dp is DiscoveryProfile => !!dp)
      .map(dp => ({
        ...dp,
        compatibilityScore: scoreMap.get(dp.profile.user_id),
      }));

    const saved = await getDiscoveryPosition();
    const startIndex = Math.min(saved, rankedProfiles.length - 1);

    const urls = rankedProfiles.slice(0, 3).flatMap(p => p.photos.map(ph => ph.storage_path));
    prefetchProfileImages(urls);

    set({ profiles: rankedProfiles, currentIndex: Math.max(startIndex, 0), dailyLikesRemaining: limit, isLoading: false });
  },

  interact: async (senderId, receiverId, type, targetType, targetId, comment) => {
    if (type === 'like' || type === 'rose') {
      if (isRateLimited('like', 30)) return { matched: false };
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
    const next = get().currentIndex + 1;
    set({ currentIndex: next });
    saveDiscoveryPosition(next);
  },

  previousProfile: () => {
    const current = get().currentIndex;
    if (current > 0) {
      const prev = current - 1;
      set({ currentIndex: prev });
      saveDiscoveryPosition(prev);
    }
  },

  deleteLastPass: async (senderId, receiverId) => {
    await supabase
      .from('interactions')
      .delete()
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('type', 'pass');
  },

  resetDailyLikes: () => {
    set({ dailyLikesRemaining: DAILY_LIKE_LIMIT });
  },
}));
