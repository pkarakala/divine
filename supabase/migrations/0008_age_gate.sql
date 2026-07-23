-- ============================================================================
-- Migration 0008 — 18+ age gate (App Store requirement; dating apps are 17+/18+)
-- ============================================================================
--
-- Dating apps must hard-enforce adults-only. The client validates DOB during
-- onboarding, but the server is the gate: a BEFORE INSERT OR UPDATE trigger
-- rejects any profile whose date_of_birth is under 18 (or absurdly old, as a
-- sanity bound). A trigger is used instead of a CHECK constraint because age
-- depends on CURRENT_DATE, which isn't immutable.
--
-- date_of_birth may still be NULL for pre-existing rows; the app now requires
-- it during onboarding, and discovery can later require it non-null.
--
-- SAFETY: Additive / idempotent. Existing rows are not modified; the gate
-- applies to new writes. Safe to re-run.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_adult_age()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    IF NEW.date_of_birth > (CURRENT_DATE - INTERVAL '18 years') THEN
      RAISE EXCEPTION 'age_gate_under_18'
        USING HINT = 'You must be at least 18 years old to use Divine.';
    END IF;
    IF NEW.date_of_birth < (CURRENT_DATE - INTERVAL '100 years') THEN
      RAISE EXCEPTION 'age_gate_invalid_dob'
        USING HINT = 'Please enter a valid date of birth.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_adult_age ON public.profiles;
CREATE TRIGGER trg_enforce_adult_age
  BEFORE INSERT OR UPDATE OF date_of_birth ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_adult_age();

COMMIT;

-- ============================================================================
-- HOW TO RUN — paste into the Supabase SQL Editor and Run.
-- Expected: "Success. No rows returned."
-- POST-APPLY CHECK: inserting/updating a profile with date_of_birth 17 years
-- ago fails with 'age_gate_under_18'; an adult DOB succeeds.
-- ============================================================================
