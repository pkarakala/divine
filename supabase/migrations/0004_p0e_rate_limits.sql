-- ============================================================================
-- Migration 0004 — P0-E: Server-side rate limiting (daily like limits)
-- ============================================================================
--
-- Addresses audit finding H-3 (docs/AUDIT-HANDOFF.md): all rate limiting was
-- client-side, in-memory JS — an app restart or a trivial script bypassed the
-- free-tier daily like limit entirely, breaking both the monetization model
-- and abuse protection.
--
-- Enforcement: a BEFORE INSERT trigger on `interactions` counts the sender's
-- likes/roses since UTC midnight and rejects over-limit inserts with a
-- recognizable error message the client can surface.
--
-- Limits (server = hard abuse ceiling; client = UX-level limit):
--   • likes  — free tier: 12/day. The client A/B experiment tests 5/8/12
--     (lib/experiments.ts 'daily_likes_limit'), so the server ceiling is the
--     max variant; tighten to the winning variant when the experiment ends.
--     plus/elite: unlimited (product promise).
--   • roses  — 25/day for ALL tiers (largest purchasable pack). There is no
--     server-side rose ledger until RevenueCat lands; this is an anti-spam
--     ceiling, not entitlement accounting.
--   • passes — unlimited (harmless, needed for normal browsing).
--
-- The BEFORE trigger runs ahead of the AFTER match-creation trigger (0001),
-- so an over-limit like can never create a match.
--
-- SAFETY: Additive / idempotent. No data deleted. Safe to re-run.
-- ============================================================================

BEGIN;

-- Count-today helper + limit check. SECURITY DEFINER: needs to read the
-- sender's subscription_tier regardless of the caller's row visibility.
CREATE OR REPLACE FUNCTION public.enforce_daily_interaction_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  tier TEXT;
  likes_today INTEGER;
  roses_today INTEGER;
  free_like_limit CONSTANT INTEGER := 12;  -- max A/B variant; tighten post-experiment
  rose_limit      CONSTANT INTEGER := 25;  -- largest purchasable pack / anti-spam
BEGIN
  -- Passes are never limited.
  IF NEW.type = 'pass' THEN
    RETURN NEW;
  END IF;

  SELECT subscription_tier INTO tier
  FROM public.users
  WHERE id = NEW.sender_id;

  IF NEW.type = 'like' THEN
    -- plus/elite: unlimited likes (product promise).
    IF tier IN ('plus', 'elite') THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO likes_today
    FROM public.interactions
    WHERE sender_id = NEW.sender_id
      AND type = 'like'
      AND created_at >= date_trunc('day', NOW());

    IF likes_today >= free_like_limit THEN
      RAISE EXCEPTION 'daily_like_limit_reached'
        USING HINT = 'Free tier daily like limit hit; upgrade for unlimited likes.';
    END IF;

  ELSIF NEW.type = 'rose' THEN
    SELECT COUNT(*) INTO roses_today
    FROM public.interactions
    WHERE sender_id = NEW.sender_id
      AND type = 'rose'
      AND created_at >= date_trunc('day', NOW());

    IF roses_today >= rose_limit THEN
      RAISE EXCEPTION 'daily_rose_limit_reached'
        USING HINT = 'Daily rose ceiling hit.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_daily_interaction_limits ON public.interactions;
CREATE TRIGGER trg_enforce_daily_interaction_limits
  BEFORE INSERT ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_interaction_limits();

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run (after 0001–0003).
-- Expected: "Success. No rows returned."
--
-- POST-APPLY CHECK (manual, or see scripts/verify-rls-hardening.ts):
--   As a free-tier user, the 13th like of the (UTC) day fails with
--   'daily_like_limit_reached'; likes as plus/elite are unlimited.
-- ============================================================================
