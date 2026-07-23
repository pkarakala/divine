-- ============================================================================
-- Migration 0007 — Perf: RLS initplan optimization (Supabase advisor lint)
-- ============================================================================
--
-- The Supabase Security/Performance Advisor flags "Auth RLS Initialization
-- Plan" on our policies: bare auth.uid() in a policy is re-evaluated for
-- EVERY row scanned. Wrapping it as (SELECT auth.uid()) turns it into an
-- initplan evaluated once per query. Same semantics, much better at scale.
--
-- This migration recreates every client-facing policy with the optimized
-- form. NO behavior changes — each policy is byte-for-byte equivalent except
-- auth.uid() -> (SELECT auth.uid()).
--
-- SAFETY: Idempotent (DROP POLICY IF EXISTS + CREATE). Safe to re-run.
-- Requires 0001–0006 applied.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- users ----
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ------------------------------------------------------------- profiles ----
DROP POLICY IF EXISTS "Own or matched profile readable" ON public.profiles;
CREATE POLICY "Own or matched profile readable" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.status = 'active'
        AND (
          (m.user_1_id = (SELECT auth.uid()) AND m.user_2_id = public.profiles.user_id)
          OR
          (m.user_2_id = (SELECT auth.uid()) AND m.user_1_id = public.profiles.user_id)
        )
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can modify own profile" ON public.profiles;
CREATE POLICY "Users can modify own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------------------------- photos ----
DROP POLICY IF EXISTS "Users manage own photos" ON public.photos;
CREATE POLICY "Users manage own photos" ON public.photos
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own photos" ON public.photos;
CREATE POLICY "Users delete own photos" ON public.photos
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- -------------------------------------------------------------- prompts ----
DROP POLICY IF EXISTS "Users manage own prompts" ON public.prompts;
CREATE POLICY "Users manage own prompts" ON public.prompts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users update own prompts" ON public.prompts;
CREATE POLICY "Users update own prompts" ON public.prompts
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users delete own prompts" ON public.prompts;
CREATE POLICY "Users delete own prompts" ON public.prompts
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------------------- interactions ----
DROP POLICY IF EXISTS "Users can create interactions" ON public.interactions;
CREATE POLICY "Users can create interactions" ON public.interactions
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND NOT public.is_blocked_pair(sender_id, receiver_id)
  );

DROP POLICY IF EXISTS "Users can see received interactions" ON public.interactions;
CREATE POLICY "Users can see received interactions" ON public.interactions
  FOR SELECT USING (
    (SELECT auth.uid()) = receiver_id OR (SELECT auth.uid()) = sender_id
  );

-- -------------------------------------------------------------- matches ----
DROP POLICY IF EXISTS "Users see own matches" ON public.matches;
CREATE POLICY "Users see own matches" ON public.matches
  FOR SELECT USING (
    (SELECT auth.uid()) = user_1_id OR (SELECT auth.uid()) = user_2_id
  );

DROP POLICY IF EXISTS "Users can update own matches" ON public.matches;
CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_1_id OR (SELECT auth.uid()) = user_2_id)
  WITH CHECK ((SELECT auth.uid()) = user_1_id OR (SELECT auth.uid()) = user_2_id);

-- ------------------------------------------------------------- messages ----
DROP POLICY IF EXISTS "Users read match messages" ON public.messages;
CREATE POLICY "Users read match messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
        AND (user_1_id = (SELECT auth.uid()) OR user_2_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users send messages in matches" ON public.messages;
CREATE POLICY "Users send messages in matches" ON public.messages
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'active'
        AND (m.user_1_id = (SELECT auth.uid()) OR m.user_2_id = (SELECT auth.uid()))
        AND NOT public.is_blocked_pair(m.user_1_id, m.user_2_id)
    )
  );

-- --------------------------------------------------------------- events ----
DROP POLICY IF EXISTS "Admins create events" ON public.events;
CREATE POLICY "Admins create events" ON public.events
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

-- ---------------------------------------------------------- event_rsvps ----
DROP POLICY IF EXISTS "Users can RSVP" ON public.event_rsvps;
CREATE POLICY "Users can RSVP" ON public.event_rsvps
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users see own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users see own RSVPs" ON public.event_rsvps
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- -------------------------------------------------------- verifications ----
DROP POLICY IF EXISTS "Users submit own verification" ON public.verifications;
CREATE POLICY "Users submit own verification" ON public.verifications
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users see own verification" ON public.verifications;
CREATE POLICY "Users see own verification" ON public.verifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- -------------------------------------------------------------- reports ----
DROP POLICY IF EXISTS "Users can report" ON public.reports;
CREATE POLICY "Users can report" ON public.reports
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);

DROP POLICY IF EXISTS "Users read own reports" ON public.reports;
CREATE POLICY "Users read own reports" ON public.reports
  FOR SELECT USING ((SELECT auth.uid()) = reporter_id);

-- ---------------------------------------------------------- push_tokens ----
DROP POLICY IF EXISTS "Users manage own tokens" ON public.push_tokens;
CREATE POLICY "Users manage own tokens" ON public.push_tokens
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------- analytics_events ----
DROP POLICY IF EXISTS "Users can insert own events" ON public.analytics_events;
CREATE POLICY "Users can insert own events" ON public.analytics_events
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own events" ON public.analytics_events;
CREATE POLICY "Users can read own events" ON public.analytics_events
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------- user_scores ----
DROP POLICY IF EXISTS "Users read own score" ON public.user_scores;
CREATE POLICY "Users read own score" ON public.user_scores
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------- photo_moderation ----
DROP POLICY IF EXISTS "Users see own moderation" ON public.photo_moderation;
CREATE POLICY "Users see own moderation" ON public.photo_moderation
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------------------------- blocks ----
DROP POLICY IF EXISTS "Users create own blocks" ON public.blocks;
CREATE POLICY "Users create own blocks" ON public.blocks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users read own blocks" ON public.blocks;
CREATE POLICY "Users read own blocks" ON public.blocks
  FOR SELECT USING ((SELECT auth.uid()) = blocker_id);

DROP POLICY IF EXISTS "Users delete own blocks" ON public.blocks;
CREATE POLICY "Users delete own blocks" ON public.blocks
  FOR DELETE USING ((SELECT auth.uid()) = blocker_id);

-- ------------------------------------------------------ storage.objects ----
DROP POLICY IF EXISTS "verifications: users upload own folder" ON storage.objects;
CREATE POLICY "verifications: users upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "verifications: users read own folder" ON storage.objects;
CREATE POLICY "verifications: users read own folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "photos: users upload own folder" ON storage.objects;
CREATE POLICY "photos: users upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "photos: users update own folder" ON storage.objects;
CREATE POLICY "photos: users update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "photos: users delete own folder" ON storage.objects;
CREATE POLICY "photos: users delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ---------------------------------------------------- profiles_discovery ----
-- Same optimization inside the view's block check, plus security_barrier:
-- the view is intentionally SECURITY DEFINER (that's how discovery reads past
-- the narrowed base-table policy — advisor flag acknowledged), and the barrier
-- stops leaky-function predicate pushdown from observing rows the paused/
-- blocked filters would hide.
CREATE OR REPLACE VIEW public.profiles_discovery
  WITH (security_barrier = true) AS
  SELECT
    p.id,
    p.user_id,
    p.display_name,
    p.date_of_birth,
    p.bio,
    p.city,
    p.state,
    p.occupation,
    p.employer,
    p.education_school,
    p.education_degree,
    p.height_inches,
    p.organization,
    p.chapter_name,
    p.line_name,
    p.line_number,
    p.initiation_year,
    p.org_preference
  FROM public.profiles p
  JOIN public.users u ON u.id = p.user_id
  WHERE COALESCE(u.is_paused, FALSE) = FALSE
    AND NOT public.is_blocked_pair((SELECT auth.uid()), p.user_id);

REVOKE ALL ON public.profiles_discovery FROM PUBLIC;
GRANT SELECT ON public.profiles_discovery TO authenticated;

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run (after 0001–0006).
-- Expected: "Success. No rows returned."
-- POST-APPLY: scripts/verify-rls-hardening.ts must still pass 21/21, and the
-- Advisor's "Auth RLS Initialization Plan" warnings should clear on refresh.
-- ============================================================================
