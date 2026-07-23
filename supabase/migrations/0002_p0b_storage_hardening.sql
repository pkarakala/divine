-- ============================================================================
-- Migration 0002 — P0-B: Storage hardening (verification PII off public URLs)
-- ============================================================================
--
-- Addresses audit finding C-3 (docs/AUDIT-HANDOFF.md): verification proof
-- documents (membership cards — PII) were uploaded to the `verifications`
-- bucket and referenced by public URLs, readable by anyone with the link.
--
--   1. `verifications` bucket: created if missing, forced PRIVATE. Users may
--      upload only into their own folder (<uid>/...) and read back only their
--      own files. No client can read anyone else's proof. Admin review uses
--      the Dashboard / service role (which bypasses RLS) with signed URLs.
--   2. `photos` bucket: created if missing, stays PUBLIC for MVP (profile
--      images are loaded cross-user by URL), but object writes are scoped to
--      the owner's folder so users cannot overwrite or delete others' photos.
--
-- Client contract change: app/onboarding/verification.tsx now stores the
-- STORAGE PATH (e.g. "<uid>/verification_123.jpg") in verifications.proof_url
-- instead of a public URL. No app code reads proof_url today.
--
-- SAFETY: Additive / idempotent. No objects are deleted. Making the bucket
-- private only disables the public-URL read path for verification proofs —
-- which is the point. Safe to re-run.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. verifications bucket: ensure it exists and is PRIVATE.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Users may upload proofs only into their own folder: <auth.uid()>/...
DROP POLICY IF EXISTS "verifications: users upload own folder" ON storage.objects;
CREATE POLICY "verifications: users upload own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may read back only their own proofs (e.g. to show upload state).
-- Nobody else's proofs are readable by any client; admin review goes through
-- the Dashboard or a service-role signed URL.
DROP POLICY IF EXISTS "verifications: users read own folder" ON storage.objects;
CREATE POLICY "verifications: users read own folder" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- No UPDATE/DELETE policies for clients on verifications: once submitted, a
-- proof is immutable from the client (prevents swapping the document after
-- approval). Deletion/retention is a service-role concern.

-- ----------------------------------------------------------------------------
-- 2. photos bucket: ensure it exists; PUBLIC for MVP (cross-user profile
--    images load by URL), but writes are owner-folder-scoped.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "photos: users upload own folder" ON storage.objects;
CREATE POLICY "photos: users upload own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "photos: users update own folder" ON storage.objects;
CREATE POLICY "photos: users update own folder" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "photos: users delete own folder" ON storage.objects;
CREATE POLICY "photos: users delete own folder" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated read of photos via the storage API (the public-URL CDN path
-- works regardless because the bucket is public; this covers API downloads).
DROP POLICY IF EXISTS "photos: authenticated read" ON storage.objects;
CREATE POLICY "photos: authenticated read" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');

COMMIT;

-- ============================================================================
-- HOW TO RUN — same as 0001: paste into the Supabase SQL Editor and Run.
-- Expected: "Success. No rows returned."
--
-- POST-APPLY CHECKS (scripts/verify-rls-hardening.ts covers the DB side; for
-- storage, as an authenticated non-owner):
--   • getPublicUrl on a verifications object -> URL returns 400/404 (private)
--   • upload to verifications/<other-uid>/x.jpg -> denied
--   • upload to verifications/<own-uid>/x.jpg   -> ok
--   • upload to photos/<other-uid>/x.jpg        -> denied
-- ============================================================================
