import { supabase } from './supabase';

type Callback = (payload: any) => void;

export function subscribeToNewLikes(userId: string, onLike: Callback) {
  const channel = supabase
    .channel(`likes:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'interactions',
      filter: `receiver_id=eq.${userId}`,
    }, (payload) => {
      const { type } = payload.new;
      if (type === 'like' || type === 'rose') {
        onLike(payload.new);
      }
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function subscribeToNewMatches(userId: string, onMatch: Callback) {
  const channel = supabase
    .channel(`matches:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches',
      filter: `user_1_id=eq.${userId}`,
    }, (payload) => {
      onMatch(payload.new);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches',
      filter: `user_2_id=eq.${userId}`,
    }, (payload) => {
      onMatch(payload.new);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function subscribeToMatchMessages(userId: string, onMessage: Callback) {
  const channel = supabase
    .channel(`all-messages:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    }, (payload) => {
      if (payload.new.sender_id !== userId) {
        onMessage(payload.new);
      }
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
