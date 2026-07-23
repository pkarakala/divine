-- ============================================================================
-- Migration 0003 — P0-C: Real, server-enforced blocking
-- ============================================================================
--
-- Addresses audit finding C-4 (docs/AUDIT-HANDOFF.md): blocking was client-side
-- only and non-functional — it wrote a `reports` row with a client-set
-- status='actioned', then tried to read it back through a SELECT policy that
-- doesn't exist. Nothing server-side stopped a blocked user from appearing in
-- discovery, matching, or messaging.
--
--   1. New `blocks` table: blocker -> blocked, owner-scoped RLS
--      (insert/select/delete own blocks only). One-directional rows; all
--      enforcement checks BOTH directions via a SECURITY DEFINER helper so a
--      user never learns who blocked them.
--   2. `is_blocked_pair(a, b)` helper — used by policies/trigger/view.
--   3. Match trigger (from 0001) now refuses to create a match for a blocked
--      pair (fills the TODO hook).
--   4. Messages INSERT policy: blocked pairs cannot message even inside a
--      still-active match row.
--   5. Interactions INSERT policy: blocked pairs cannot like/rose each other
--      (prevents like-notifications as a harassment channel).
--   6. profiles_discovery view: blocked pairs are invisible to each other.
--   7. `reports` hardening: clients can no longer set status (column-level
--      INSERT grant; status always defaults to 'pending'); reporters can read
--      their own reports.
--   8. Data migration: existing "User blocked" report rows become blocks rows.
--
-- SAFETY: Additive / idempotent. No data deleted. Requires 0001 (match
-- trigger + profiles_discovery) to be applied first. Safe to re-run.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. blocks table + owner-scoped RLS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create own blocks" ON public.blocks;
CREATE POLICY "Users create own blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users read own blocks" ON public.blocks;
CREATE POLICY "Users read own blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users delete own blocks" ON public.blocks;
CREATE POLICY "Users delete own blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ----------------------------------------------------------------------------
-- 2. Bidirectional helper. SECURITY DEFINER so policies/views can check the
--    blocked-by direction without the blocked user being able to enumerate
--    who blocked them.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_blocked_pair(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  );
$$;

REVOKE ALL ON FUNCTION public.is_blocked_pair(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked_pair(UUID, UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Match trigger: no matches between blocked pairs (fills the 0001 TODO).
-- ----------------------------------------------------------------------------
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

  -- No matches between blocked pairs (either direction).
  IF public.is_blocked_pair(NEW.sender_id, NEW.receiver_id) THEN
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

-- ----------------------------------------------------------------------------
-- 4. Messages: blocked pairs cannot message, even in an active match row.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users send messages in matches" ON public.messages;
CREATE POLICY "Users send messages in matches" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'active'
        AND (m.user_1_id = auth.uid() OR m.user_2_id = auth.uid())
        AND NOT public.is_blocked_pair(m.user_1_id, m.user_2_id)
    )
  );

-- ----------------------------------------------------------------------------
-- 5. Interactions: blocked pairs cannot like/rose/pass each other (a like on
--    a blocked pair would otherwise still fire the on-new-like notification —
--    a harassment channel).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create interactions" ON public.interactions;
CREATE POLICY "Users can create interactions" ON public.interactions
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.is_blocked_pair(sender_id, receiver_id)
  );

-- ----------------------------------------------------------------------------
-- 6. Discovery: blocked pairs are invisible to each other.
--    (Recreates the 0001 view with the block filter added.)
-- ----------------------------------------------------------------------------
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
  WHERE COALESCE(u.is_paused, FALSE) = FALSE
    AND NOT public.is_blocked_pair(auth.uid(), p.user_id);

REVOKE ALL ON public.profiles_discovery FROM PUBLIC;
GRANT SELECT ON public.profiles_discovery TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. reports hardening: clients can't set status (always defaults 'pending');
--    reporters can read their own reports.
-- ----------------------------------------------------------------------------
REVOKE INSERT ON public.reports FROM authenticated;
REVOKE INSERT ON public.reports FROM anon;
GRANT INSERT (reporter_id, reported_id, reason, details)
  ON public.reports TO authenticated;

DROP POLICY IF EXISTS "Users read own reports" ON public.reports;
CREATE POLICY "Users read own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- ----------------------------------------------------------------------------
-- 8. Data migration: legacy "block" rows (reports with details='User blocked',
--    status='actioned') become real blocks. Idempotent via ON CONFLICT.
-- ----------------------------------------------------------------------------
INSERT INTO public.blocks (blocker_id, blocked_id)
SELECT DISTINCT r.reporter_id, r.reported_id
FROM public.reports r
WHERE r.details = 'User blocked'
  AND r.status = 'actioned'
  AND r.reporter_id <> r.reported_id
ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run (after 0001/0002).
-- Expected: "Success. No rows returned."
--
-- POST-APPLY CHECKS (added to scripts/verify-rls-hardening.ts):
--   • INSERT own block -> ok; SELECT own blocks -> ok; others' -> 0 rows
--   • INSERT block with blocker_id != auth.uid() -> denied
--   • is_blocked_pair enforced: like/message a blocked user -> denied
--   • blocked user's profile absent from profiles_discovery
--   • reports INSERT with status='actioned' -> denied (column not grantable)
-- ============================================================================
