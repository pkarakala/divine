import { supabase } from './supabase';

type EventType =
  | 'profile_view' | 'profile_view_duration' | 'swipe_left' | 'swipe_right'
  | 'like_sent' | 'like_received' | 'rose_sent' | 'message_sent'
  | 'message_response' | 'match_created' | 'we_met_yes' | 'we_met_no'
  | 'profile_photo_tap' | 'prompt_like' | 'session_start' | 'session_end';

interface TrackOptions {
  targetUserId?: string;
  metadata?: Record<string, any>;
}

let currentUserId: string | null = null;
let eventQueue: Array<{ user_id: string; event_type: EventType; target_user_id: string | null; metadata: any; created_at: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function setAnalyticsUser(userId: string | null) {
  currentUserId = userId;
}

export function track(eventType: EventType, options?: TrackOptions) {
  if (!currentUserId) return;

  eventQueue.push({
    user_id: currentUserId,
    event_type: eventType,
    target_user_id: options?.targetUserId || null,
    metadata: options?.metadata || {},
    created_at: new Date().toISOString(),
  });

  if (eventQueue.length >= 10) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 5000);
  }
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  await supabase.from('analytics_events').insert(batch);
}

let viewStartTime: number | null = null;
let viewedUserId: string | null = null;

export function trackProfileViewStart(targetUserId: string) {
  viewStartTime = Date.now();
  viewedUserId = targetUserId;
  track('profile_view', { targetUserId });
}

export function trackProfileViewEnd() {
  if (viewStartTime && viewedUserId) {
    const duration = Math.round((Date.now() - viewStartTime) / 1000);
    track('profile_view_duration', {
      targetUserId: viewedUserId,
      metadata: { duration_seconds: duration },
    });
  }
  viewStartTime = null;
  viewedUserId = null;
}

export function trackSessionStart() {
  track('session_start');
}

export function trackSessionEnd() {
  trackProfileViewEnd();
  track('session_end');
  flush();
}

export { flush as flushAnalytics };
