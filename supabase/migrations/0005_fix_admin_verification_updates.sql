-- ============================================================================
-- Migration 0005 — Fix: allow admin (Dashboard) verification approvals
-- ============================================================================
--
-- The 0001 guard trigger reverted privileged users columns (is_verified /
-- verification_status / subscription_tier) unless auth.role() = 'service_role'.
-- Dashboard sessions run as `postgres` with NO JWT, so auth.role() is NULL and
-- an admin's manual verification approval was silently reverted — breaking the
-- manual-review MVP workflow.
--
-- Fix: revert ONLY for end-user roles ('authenticated' / 'anon'). Those roles
-- are additionally blocked by the column-level grants from 0001 (they can only
-- UPDATE gender/looking_for/public_key/is_paused at all), so the trigger stays
-- a defense-in-depth backup, not the primary lock. postgres / service_role /
-- other server-side roles pass through untouched.
--
-- SAFETY: Additive / idempotent (CREATE OR REPLACE). Safe to re-run.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.protect_privileged_user_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Revert privileged columns only for end-user JWT roles. Admin (Dashboard,
  -- role postgres, no JWT) and service_role pass through.
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    NEW.is_verified          := OLD.is_verified;
    NEW.verification_status  := OLD.verification_status;
    NEW.subscription_tier    := OLD.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run.
-- Expected: "Success. No rows returned."
--
-- POST-APPLY CHECK: in the SQL Editor (as admin), this must now stick:
--   UPDATE public.users SET verification_status = 'approved', is_verified = true
--   WHERE id = '<some user id>';
--   SELECT id, is_verified, verification_status FROM public.users WHERE id = '<same id>';
-- And scripts/verify-rls-hardening.ts must still show the C-1 client checks passing.
-- ============================================================================
