import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { isRateLimited } from '../lib/rateLimit';
import { getBlockedUserIds } from '../lib/blockList';
import type { Match, Message, Profile, Photo, Prompt } from '../types/database';

export interface MatchWithProfile extends Match {
  other_user: {
    profile: Profile;
    photos: Photo[];
    prompts: Prompt[];
  };
  last_message: Message | null;
  unread_count: number;
}

interface MatchState {
  matches: MatchWithProfile[];
  currentChat: Message[];
  isLoading: boolean;

  fetchMatches: (userId: string) => Promise<void>;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, senderId: string, content: string, type?: 'text' | 'image', mediaUrl?: string) => Promise<void>;
  unmatch: (matchId: string) => Promise<void>;
  subscribeToMessages: (matchId: string) => () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  currentChat: [],
  isLoading: false,

  fetchMatches: async (userId) => {
    set({ isLoading: true });
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .eq('status', 'active')
      .order('matched_at', { ascending: false });

    if (!data) {
      set({ isLoading: false });
      return;
    }

    const blockedIds = await getBlockedUserIds(userId);
    const blockedSet = new Set(blockedIds);
    const filteredData = data.filter(match => {
      const otherId = match.user_1_id === userId ? match.user_2_id : match.user_1_id;
      return !blockedSet.has(otherId);
    });

    const matchesWithProfiles: MatchWithProfile[] = await Promise.all(
      filteredData.map(async (match) => {
        const otherUserId = match.user_1_id === userId ? match.user_2_id : match.user_1_id;

        const [profileRes, photosRes, promptsRes, messagesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', otherUserId).single(),
          supabase.from('photos').select('*').eq('user_id', otherUserId).order('order_index'),
          supabase.from('prompts').select('*').eq('user_id', otherUserId).order('order_index'),
          supabase.from('messages').select('*').eq('match_id', match.id).order('created_at', { ascending: false }).limit(1),
        ]);

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .neq('sender_id', userId)
          .is('read_at', null);

        return {
          ...match,
          other_user: {
            profile: profileRes.data!,
            photos: photosRes.data || [],
            prompts: promptsRes.data || [],
          },
          last_message: messagesRes.data?.[0] || null,
          unread_count: count || 0,
        };
      })
    );

    set({ matches: matchesWithProfiles, isLoading: false });
  },

  fetchMessages: async (matchId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    set({ currentChat: data || [] });
  },

  sendMessage: async (matchId, senderId, content, type = 'text', mediaUrl) => {
    if (isRateLimited('message', 20)) return;
    const insertData: any = { match_id: matchId, sender_id: senderId, content, type };
    if (mediaUrl) insertData.media_url = mediaUrl;

    const { data } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (data) {
      set({ currentChat: [...get().currentChat, data] });
    }
  },

  unmatch: async (matchId) => {
    await supabase
      .from('matches')
      .update({ status: 'unmatched' })
      .eq('id', matchId);

    set({ matches: get().matches.filter(m => m.id !== matchId) });
  },

  subscribeToMessages: (matchId) => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const newMessage = payload.new as Message;
        const current = get().currentChat;
        if (!current.find(m => m.id === newMessage.id)) {
          set({ currentChat: [...current, newMessage] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
