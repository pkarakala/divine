-- ============================================================================
-- Migration 0006 — P1-G: last_active_at heartbeat (M-3)
-- ============================================================================
--
-- The base schema defined update_last_active() but never attached it to any
-- trigger, so last_active_at stayed at its signup default forever — making
-- "active recently" sorting and the activity score meaningless.
--
-- Fix: an explicit heartbeat RPC the app calls on session start / foreground.
-- last_active_at is intentionally NOT in the client UPDATE column allowlist
-- (0001): a direct grant would let a client write ARBITRARY timestamps to game
-- activity-based ranking. The RPC can only ever set NOW() for the caller.
--
-- Also drops the dead update_last_active() function from the base schema.
--
-- SAFETY: Additive / idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.users SET last_active_at = NOW() WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.touch_last_active() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;

-- Dead code from the base schema (defined, never attached to a trigger).
DROP FUNCTION IF EXISTS public.update_last_active();

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run.
-- Expected: "Success. No rows returned."
-- ============================================================================
