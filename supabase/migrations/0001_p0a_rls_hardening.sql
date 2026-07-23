-- ============================================================================
-- Migration 0001 — P0-A: RLS hardening / server-enforced trust & safety
-- ============================================================================
--
-- Addresses audit findings (see docs/AUDIT-HANDOFF.md):
--   C-1  users UPDATE must not let clients set is_verified / verification_status
--        / subscription_tier.
--   C-2  Clients must not INSERT into matches; matches are created only by a
--        SECURITY DEFINER trigger when a reciprocal like/rose exists.
--   H-2  Replace profiles USING(true) SELECT with a discovery VIEW that omits
--        exact latitude/longitude; serve bucketed distance via an RPC.
--   M-5  user_scores: service-role write only; SELECT scoped to the owner.
--   L-6  photo_moderation: service-role write only (verdict never client-set).
--   L-4  Add 'experiment_exposure' to the analytics_events event_type CHECK.
--
-- SAFETY: This is an ADDITIVE / IDEMPOTENT migration. It does NOT drop any
-- table or column and it does NOT delete data. It is safe to re-run. It has
-- NOT been applied to any live database — see "HOW TO RUN" at the bottom.
--
-- The base schema in supabase/schema.sql remains the source of truth for table
-- shapes; this file layers the hardened policies on top.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. New column: users.is_paused (referenced by app/settings/account.tsx, but
--    absent from the base schema — the pause toggle currently errors).
-- ----------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================================
-- C-1 — Lock down users UPDATE to a safe column allowlist.
-- ============================================================================
-- RLS cannot restrict UPDATE per-column, so we use column-level privileges as
-- the hard enforcement layer (a client physically cannot UPDATE a column it was
-- not granted) and keep an RLS row policy for row ownership. Privileged columns
-- (is_verified / verification_status / subscription_tier) are granted to NO
-- client role and can only be written by the service role (RevenueCat webhook,
-- admin verification Edge Function, etc.).

-- Remove any blanket UPDATE privilege the client roles may have inherited.
REVOKE UPDATE ON public.users FROM authenticated;
REVOKE UPDATE ON public.users FROM anon;

-- Allowlist: the only columns a signed-in client may ever update on its row.
--   gender, looking_for  -> set during onboarding (verification.tsx) / preferences
--   public_key           -> E2E key publication (lib/encryptedChat.ts)
--   is_paused            -> pause toggle (settings/account.tsx)
GRANT UPDATE (gender, looking_for, public_key, is_paused)
  ON public.users TO authenticated;

-- Row-ownership policy (recreate idempotently, now WITH CHECK so a client
-- cannot repoint the row to another id).
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Defense-in-depth: even if a future GRANT widens column access, this trigger
-- reverts privileged columns for any non-service-role caller. The service role
-- (JWT role claim = 'service_role') is the only path allowed to change them.
CREATE OR REPLACE FUNCTION public.protect_privileged_user_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.is_verified          := OLD.is_verified;
    NEW.verification_status  := OLD.verification_status;
    NEW.subscription_tier    := OLD.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_user_columns ON public.users;
CREATE TRIGGER trg_protect_privileged_user_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_user_columns();


-- ============================================================================
-- C-2 — Clients cannot create matches; a reciprocal-like trigger owns them.
-- ============================================================================

-- Revoke the client's ability to insert matches directly.
DROP POLICY IF EXISTS "System creates matches" ON public.matches;
REVOKE INSERT ON public.matches FROM authenticated;
REVOKE INSERT ON public.matches FROM anon;

-- Keep read + owner-update policies, but recreate the UPDATE policy WITH CHECK
-- so a client cannot re-point a match to other users while updating status.
DROP POLICY IF EXISTS "Users can update own matches" ON public.matches;
CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE
  USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)
  WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Backstop against duplicate active matches for the same (unordered) pair.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_matches_active_pair
  ON public.matches (LEAST(user_1_id, user_2_id), GREATEST(user_1_id, user_2_id))
  WHERE status = 'active';

-- SECURITY DEFINER: creates a match only when the just-inserted like/rose is
-- reciprocated by an existing like/rose from the receiver. Runs as owner, so it
-- can INSERT into matches even though clients no longer can.
CREATE OR REPLACE FUNCTION public.create_match_on_reciprocal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  u1 UUID;
  u2 UUID;
BEGIN
  -- Only likes/roses can form matches; passes never do.
  IF NEW.type NOT IN ('like', 'rose') THEN
    RETURN NEW;
  END IF;

  -- No self-matches.
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;

  -- Require a reciprocal like/rose from the receiver back to the sender.
  IF NOT EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.sender_id   = NEW.receiver_id
      AND i.receiver_id = NEW.sender_id
      AND i.type IN ('like', 'rose')
  ) THEN
    RETURN NEW;
  END IF;

  -- Normalize pair ordering to match the unique index.
  u1 := LEAST(NEW.sender_id, NEW.receiver_id);
  u2 := GREATEST(NEW.sender_id, NEW.receiver_id);

  -- TODO(P0-C): once the blocks table exists, skip match creation when either
  -- user has blocked the other.

  -- Idempotent: skip if an active match already exists for this pair.
  IF EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.status = 'active'
      AND LEAST(m.user_1_id, m.user_2_id)    = u1
      AND GREATEST(m.user_1_id, m.user_2_id) = u2
  ) THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.matches (user_1_id, user_2_id, status, expires_at)
    VALUES (u1, u2, 'active', NOW() + INTERVAL '7 days');
  EXCEPTION
    WHEN unique_violation THEN
      -- Lost a race with a concurrent reciprocal insert; the match exists.
      NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_match_on_reciprocal ON public.interactions;
CREATE TRIGGER trg_create_match_on_reciprocal
  AFTER INSERT ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_reciprocal();


-- ============================================================================
-- H-2 — Discovery view without exact coordinates + bucketed-distance RPC.
-- ============================================================================

-- Narrow the base-table profiles SELECT: a client may read a full profile row
-- (which still includes latitude/longitude) ONLY for itself or for a user it is
-- actively matched with. Mass reads of every user's exact location are gone.
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON public.profiles;
CREATE POLICY "Own or matched profile readable" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.status = 'active'
        AND (
          (m.user_1_id = auth.uid() AND m.user_2_id = public.profiles.user_id)
          OR
          (m.user_2_id = auth.uid() AND m.user_1_id = public.profiles.user_id)
        )
    )
  );

-- Discovery reads go through this view, which omits latitude/longitude entirely
-- and hides paused users. The view runs with the definer's rights (default
-- security_invoker = false), so it can surface all non-paused profiles for
-- discovery without granting broad base-table SELECT.
CREATE OR REPLACE VIEW public.profiles_discovery AS
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
  WHERE COALESCE(u.is_paused, FALSE) = FALSE;
  -- NOTE: verification gating ("won't appear until approved") can be enforced
  -- here later with `AND u.is_verified = TRUE`; left off for now so seeded/dev
  -- data still appears in discovery.

REVOKE ALL ON public.profiles_discovery FROM PUBLIC;
GRANT SELECT ON public.profiles_discovery TO authenticated;

-- Bucketed distance: clients pass their own coordinates; the function reads the
-- target's exact coordinates (which clients can no longer see) and returns only
-- a coarse bucket string, never a precise distance.
CREATE OR REPLACE FUNCTION public.distance_bucket(
  target_user_id UUID,
  viewer_lat DOUBLE PRECISION,
  viewer_lng DOUBLE PRECISION
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tlat  DOUBLE PRECISION;
  tlng  DOUBLE PRECISION;
  miles DOUBLE PRECISION;
BEGIN
  IF viewer_lat IS NULL OR viewer_lng IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.latitude, p.longitude
    INTO tlat, tlng
  FROM public.profiles p
  WHERE p.user_id = target_user_id;

  IF tlat IS NULL OR tlng IS NULL THEN
    RETURN NULL;
  END IF;

  -- Haversine, Earth radius 3959 miles.
  miles := 3959 * 2 * asin(sqrt(
      power(sin(radians(tlat - viewer_lat) / 2), 2)
    + cos(radians(viewer_lat)) * cos(radians(tlat))
      * power(sin(radians(tlng - viewer_lng) / 2), 2)
  ));

  RETURN CASE
    WHEN miles < 1  THEN '< 1 mile'
    WHEN miles < 5  THEN '1-5 miles'
    WHEN miles < 10 THEN '5-10 miles'
    WHEN miles < 25 THEN '10-25 miles'
    WHEN miles < 50 THEN '25-50 miles'
    ELSE '50+ miles'
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.distance_bucket(UUID, DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.distance_bucket(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;


-- ============================================================================
-- M-5 — user_scores: service-role write only; SELECT scoped to owner.
-- ============================================================================
DROP POLICY IF EXISTS "Scores readable by authenticated" ON public.user_scores;
DROP POLICY IF EXISTS "System updates scores" ON public.user_scores;

-- Owner may read only its own score row. No client write policy exists, so RLS
-- denies all client writes; the service role bypasses RLS for recompute-scores.
CREATE POLICY "Users read own score" ON public.user_scores
  FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.user_scores FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_scores FROM anon;


-- ============================================================================
-- L-6 — photo_moderation: service-role write only (verdict never client-set).
-- ============================================================================
DROP POLICY IF EXISTS "System inserts moderation" ON public.photo_moderation;
-- Keep "Users see own moderation" (owner SELECT) as-is.

REVOKE INSERT, UPDATE, DELETE ON public.photo_moderation FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.photo_moderation FROM anon;


-- ============================================================================
-- L-4 — Allow the experiment_exposure analytics event type.
-- ============================================================================
ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_event_type_check CHECK (event_type IN (
    'profile_view', 'profile_view_duration', 'swipe_left', 'swipe_right',
    'like_sent', 'like_received', 'rose_sent', 'message_sent',
    'message_response', 'match_created', 'we_met_yes', 'we_met_no',
    'profile_photo_tap', 'prompt_like', 'session_start', 'session_end',
    'experiment_exposure'
  ));

COMMIT;

-- ============================================================================
-- HOW TO RUN
-- ============================================================================
-- This migration is written to be applied on top of supabase/schema.sql. It is
-- idempotent and non-destructive, and has NOT been run against any database.
--
-- Option A — Supabase SQL Editor (quickest for the hosted project):
--   1. Open the Supabase Dashboard → SQL Editor.
--   2. Confirm you are pointed at the intended (NON-production first) project.
--   3. Paste this file's contents and Run. Re-running is safe.
--
-- Option B — Supabase CLI (recommended, keeps migrations reproducible):
--   1. Ensure the Supabase CLI is linked: `supabase link --project-ref <ref>`.
--   2. This file already lives in supabase/migrations/ with a sortable prefix.
--   3. Dry-run against a local/staging DB first:
--        supabase db reset            # local: applies schema.sql + migrations
--      or apply just this migration to a linked staging project:
--        supabase db push
--   4. Only after verifying on staging, run `supabase db push` against prod.
--
-- Option C — psql:
--   psql "$DATABASE_URL" -f supabase/migrations/0001_p0a_rls_hardening.sql
--
-- POST-APPLY CHECKS (run as an anon/authenticated client, expect failures):
--   • UPDATE users SET is_verified = true WHERE id = auth.uid();      -> denied
--   • INSERT INTO matches (...) VALUES (...);                          -> denied
--   • SELECT latitude, longitude FROM profiles WHERE user_id <> me;    -> no rows
--   • SELECT * FROM user_scores WHERE user_id <> me;                   -> no rows
--   • INSERT INTO photo_moderation (...);                             -> denied
--   • SELECT * FROM profiles_discovery LIMIT 1;                        -> ok, no lat/long
--   • Reciprocal likes between two users auto-create one active match.
-- ============================================================================
