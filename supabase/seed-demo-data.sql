-- ============================================================================
-- Divine — Demo Data Seed: Likes tab + new profiles
-- supabase/seed-demo-data.sql
-- ============================================================================
--
-- Adds 5 new mock female profiles and seeds the demo account's Likes tab.
--
-- What this creates:
--   Priya   (SGR  / Financial Advisor)    — likes demo → mutual match ✓
--   Aaliyah (AKA  / Pediatric Nurse)      — likes demo → mutual match ✓
--   Simone  (DST  / UX Designer)          — likes demo, no match
--   Kennedy (ZPB  / School Principal)     — sends demo a rose, no match
--   Noelle  (SGR  / Broadcast Journalist) — no interaction (appears in Standouts)
--
-- After running, the demo account sees:
--   Likes tab  — 4 cards (Priya, Aaliyah, Simone, Kennedy)
--   Matches    — 2 active matches (Priya, Aaliyah)
--   Standouts  — Noelle + existing uninteracted profiles
--
-- SAFETY: Idempotent — safe to re-run. No existing rows are modified.
--
-- PREREQUISITE: seed-mock-data.ts must have been run first so the
-- demo@divine-test.com auth user already exists.
--
-- HOW TO RUN: Paste into Supabase Dashboard → SQL Editor → Run.
--
-- TROUBLESHOOTING: If the auth.users INSERT fails with a not-null violation
-- on "instance_id", add `'00000000-0000-0000-0000-000000000000'::uuid` as
-- the first column value after `id` and add `instance_id,` to the column
-- list — some older Supabase projects require it.
-- ============================================================================

BEGIN;

-- ─── Step 1: Auth users ─────────────────────────────────────────────────────
-- Temporarily disable the handle_new_user trigger so we can manually insert
-- into public.users in Step 2 with the correct is_verified/gender values
-- (avoids fighting the protect_privileged_user_columns BEFORE UPDATE trigger).
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

INSERT INTO auth.users (
  id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  -- Priya — SGR / Financial Advisor
  ('a0000001-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'priya@divine-test.com', '',
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),

  -- Aaliyah — AKA / Pediatric Nurse
  ('a0000002-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'aaliyah@divine-test.com', '',
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),

  -- Simone — DST / UX Designer
  ('a0000003-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'simone@divine-test.com', '',
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),

  -- Kennedy — ZPB / School Principal
  ('a0000004-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'kennedy@divine-test.com', '',
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb),

  -- Noelle — SGR / Broadcast Journalist
  ('a0000005-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'noelle@divine-test.com', '',
   NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb)

ON CONFLICT DO NOTHING;

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;


-- ─── Step 2: public.users ────────────────────────────────────────────────────
-- Direct INSERT with correct privileged values. Because we skipped the
-- handle_new_user trigger in Step 1, no public.users rows exist for these
-- users yet — this INSERT creates them fresh, bypassing the UPDATE trigger
-- that would otherwise revert is_verified / verification_status.
INSERT INTO public.users (
  id, email,
  is_verified, verification_status,
  gender, looking_for,
  last_active_at, created_at, updated_at
) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'priya@divine-test.com',   true, 'approved', 'female', 'male', NOW(), NOW(), NOW()),
  ('a0000002-0000-0000-0000-000000000002', 'aaliyah@divine-test.com', true, 'approved', 'female', 'male', NOW(), NOW(), NOW()),
  ('a0000003-0000-0000-0000-000000000003', 'simone@divine-test.com',  true, 'approved', 'female', 'male', NOW(), NOW(), NOW()),
  ('a0000004-0000-0000-0000-000000000004', 'kennedy@divine-test.com', true, 'approved', 'female', 'male', NOW(), NOW(), NOW()),
  ('a0000005-0000-0000-0000-000000000005', 'noelle@divine-test.com',  true, 'approved', 'female', 'male', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- ─── Step 3: Profiles ────────────────────────────────────────────────────────
INSERT INTO public.profiles (
  user_id, display_name, date_of_birth, bio,
  city, state, occupation, employer,
  organization, chapter_name, line_name, line_number, initiation_year,
  org_preference, created_at, updated_at
) VALUES
  (
    'a0000001-0000-0000-0000-000000000001',
    'Priya', '1996-04-12',
    'Finance by day, soror by heart. SGR raised me to lead with grace and serve with purpose.',
    'Atlanta', 'GA', 'Financial Advisor', 'JP Morgan Chase',
    'sigma_gamma_rho', 'Rho Mu Chapter', 'Golden Poodle', 7, 2016,
    'any_d9', NOW(), NOW()
  ),
  (
    'a0000002-0000-0000-0000-000000000002',
    'Aaliyah', '1997-09-30',
    'Pediatric nurse. AKA woman. I give my whole heart to my patients and to this sisterhood.',
    'Atlanta', 'GA', 'Pediatric Nurse', 'Children''s Healthcare of Atlanta',
    'alpha_kappa_alpha', 'Alpha Nu Chapter', 'Tender Heart', 2, 2017,
    'any_d9', NOW(), NOW()
  ),
  (
    'a0000003-0000-0000-0000-000000000003',
    'Simone', '1995-01-18',
    'UX designer who believes every product should center Black women. DST forever.',
    'Atlanta', 'GA', 'UX Designer', 'Mailchimp',
    'delta_sigma_theta', 'Epsilon Mu Chapter', 'Digital Delta', 9, 2015,
    'any_d9', NOW(), NOW()
  ),
  (
    'a0000004-0000-0000-0000-000000000004',
    'Kennedy', '1994-11-05',
    'School principal. Community builder. I believe the revolution starts in the classroom.',
    'Atlanta', 'GA', 'Middle School Principal', 'Atlanta Public Schools',
    'zeta_phi_beta', 'Xi Zeta Chapter', 'Blueprint', 1, 2014,
    'any_d9', NOW(), NOW()
  ),
  (
    'a0000005-0000-0000-0000-000000000005',
    'Noelle', '1996-07-22',
    'Breaking news by night, breaking stigmas every day. SGR woman, Atlanta native.',
    'Atlanta', 'GA', 'Broadcast Journalist', 'WSB-TV',
    'sigma_gamma_rho', 'Sigma Delta Chapter', 'Anchor', 4, 2016,
    'any_d9', NOW(), NOW()
  )
ON CONFLICT (user_id) DO NOTHING;


-- ─── Step 4: Photos ──────────────────────────────────────────────────────────
-- Fixed UUIDs let interactions in Step 5 reference the primary photo by ID.
-- Pattern: bXXXX01-... = primary photo for user aXXXX-...
INSERT INTO public.photos (id, user_id, storage_path, order_index, is_primary, created_at)
VALUES
  -- Priya
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=600', 0, true,  NOW()),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600', 1, false, NOW()),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600', 2, false, NOW()),
  -- Aaliyah
  ('b0000002-0000-0000-0000-000000000001', 'a0000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=600', 0, true,  NOW()),
  ('b0000002-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1625087799782-7459b2cf1e42?w=600', 1, false, NOW()),
  ('b0000002-0000-0000-0000-000000000003', 'a0000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=600', 2, false, NOW()),
  -- Simone
  ('b0000003-0000-0000-0000-000000000001', 'a0000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600', 0, true,  NOW()),
  ('b0000003-0000-0000-0000-000000000002', 'a0000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1618044733300-9472054094ee?w=600', 1, false, NOW()),
  ('b0000003-0000-0000-0000-000000000003', 'a0000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1546961342-ea5f62d95361?w=600', 2, false, NOW()),
  -- Kennedy
  ('b0000004-0000-0000-0000-000000000001', 'a0000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1595152772835-219674b2a163?w=600', 0, true,  NOW()),
  ('b0000004-0000-0000-0000-000000000002', 'a0000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=600', 1, false, NOW()),
  ('b0000004-0000-0000-0000-000000000003', 'a0000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?w=600', 2, false, NOW()),
  -- Noelle
  ('b0000005-0000-0000-0000-000000000001', 'a0000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600', 0, true,  NOW()),
  ('b0000005-0000-0000-0000-000000000002', 'a0000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600', 1, false, NOW()),
  ('b0000005-0000-0000-0000-000000000003', 'a0000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=600', 2, false, NOW())
ON CONFLICT (id) DO NOTHING;


-- ─── Step 5: Prompts ─────────────────────────────────────────────────────────
-- WHERE NOT EXISTS guards against duplicate rows (prompts has no unique constraint).
INSERT INTO public.prompts (user_id, prompt_question, prompt_answer, order_index, type, created_at)
SELECT v.user_id, v.question, v.answer, v.idx, 'text', NOW()
FROM (VALUES
  -- Priya
  ('a0000001-0000-0000-0000-000000000001'::uuid, 'Greek life taught me...',         'That real sisterhood shows up at 6am for community service and still makes it look effortless.', 0),
  ('a0000001-0000-0000-0000-000000000001'::uuid, 'A perfect date for me looks like...', 'Rooftop dinner, honest conversation, and stargazing afterward. Simple but intentional.',         1),
  ('a0000001-0000-0000-0000-000000000001'::uuid, 'The way to my heart is...',       'Lead with purpose. I''m drawn to someone who knows where they''re going and still makes time for others.', 2),
  -- Aaliyah
  ('a0000002-0000-0000-0000-000000000002'::uuid, 'My chapter means everything because...', 'Every sister has pushed me to be more — more intentional, more compassionate, more present.', 0),
  ('a0000002-0000-0000-0000-000000000002'::uuid, 'At homecoming, you''ll find me...', 'On my feet from the yard to the step show. I don''t rest until I''ve seen every soror stroll.', 1),
  ('a0000002-0000-0000-0000-000000000002'::uuid, 'My love language is...',           'Acts of service — it''s what I do at work all day, and it''s how I love the people I care about.', 2),
  -- Simone
  ('a0000003-0000-0000-0000-000000000003'::uuid, 'The community service project closest to my heart...', 'Teaching girls to code at the library. Technology should look like all of us.', 0),
  ('a0000003-0000-0000-0000-000000000003'::uuid, 'What I''m looking for in a partner...', 'Someone growth-oriented and self-aware. I want to build, not just date.', 1),
  ('a0000003-0000-0000-0000-000000000003'::uuid, 'My line name story is...',         'They called me Digital Delta because I was prototyping apps between chapter meetings. Multitasking is spiritual.', 2),
  -- Kennedy
  ('a0000004-0000-0000-0000-000000000004'::uuid, 'I knew I found my org when...',   'I saw a Zeta woman lead a city council meeting and then tutor third graders the same afternoon.', 0),
  ('a0000004-0000-0000-0000-000000000004'::uuid, 'On weekends you''ll find me...',   'At my school''s garden with kids who need somewhere to be. The classroom doesn''t end at 3pm.',  1),
  ('a0000004-0000-0000-0000-000000000004'::uuid, 'My proudest achievement is...',   'Getting our school''s graduation rate from 74% to 91% in three years. Every number is a child.', 2),
  -- Noelle
  ('a0000005-0000-0000-0000-000000000005'::uuid, 'Probate night was unforgettable because...', 'I crossed at midnight. My line sisters were crying. The yard erupted. I''ve never felt more seen.', 0),
  ('a0000005-0000-0000-0000-000000000005'::uuid, 'A perfect date for me looks like...', 'Explore a neighborhood we''ve never been to. Street food, no agenda, and a good story to tell later.', 1),
  ('a0000005-0000-0000-0000-000000000005'::uuid, 'Greek life taught me...',          'That legacy matters. Everything I do now is being watched by someone who comes after me.',          2)
) AS v(user_id, question, answer, idx)
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts p
  WHERE p.user_id = v.user_id AND p.prompt_question = v.question
);


-- ─── Step 6: Likes → demo account (populates the Likes tab) ─────────────────
-- likes.tsx query: receiver_id = demo.id, type IN ('like','rose'), seen_at IS NULL
-- target_type/target_id are required; we point each at the sender's primary photo.
-- No unique constraint on interactions — WHERE NOT EXISTS prevents duplicates.

INSERT INTO public.interactions (
  sender_id, receiver_id, type, target_type, target_id, comment, created_at
)
SELECT
  v.sender_id,
  demo.id                AS receiver_id,
  v.itype,
  'photo'                AS target_type,
  v.photo_id             AS target_id,
  v.comment,
  v.ts
FROM (VALUES
  -- Priya: like with comment (2h ago)
  ('a0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid,
   'like'::text, 'I love your vision for entrepreneurship. Would love to connect.',
   NOW() - INTERVAL '2 hours'),
  -- Aaliyah: like, no comment (5h ago)
  ('a0000002-0000-0000-0000-000000000002'::uuid, 'b0000002-0000-0000-0000-000000000001'::uuid,
   'like'::text, NULL,
   NOW() - INTERVAL '5 hours'),
  -- Simone: like with comment (1 day ago)
  ('a0000003-0000-0000-0000-000000000003'::uuid, 'b0000003-0000-0000-0000-000000000001'::uuid,
   'like'::text, 'Your prompt about authentic connection hit different.',
   NOW() - INTERVAL '1 day'),
  -- Kennedy: rose with comment (3 days ago) — shows rose badge in UI
  ('a0000004-0000-0000-0000-000000000004'::uuid, 'b0000004-0000-0000-0000-000000000001'::uuid,
   'rose'::text, 'You seem like someone who''d actually show up. That''s rare.',
   NOW() - INTERVAL '3 days')
) AS v(sender_id, photo_id, itype, comment, ts),
LATERAL (SELECT id FROM public.users WHERE email = 'demo@divine-test.com') AS demo
WHERE NOT EXISTS (
  SELECT 1 FROM public.interactions i
  WHERE i.sender_id   = v.sender_id
    AND i.receiver_id = demo.id
    AND i.type        = v.itype
);


-- ─── Step 7: Demo likes back (creates 2 matches via trigger) ─────────────────
-- The create_match_on_reciprocal trigger fires AFTER each INSERT here.
-- It sees the reciprocal likes inserted in Step 6 and auto-creates the match.
-- No manual INSERT into matches needed — and clients couldn't do it anyway (C-2).
-- Insert Priya first so Aaliyah's match fires cleanly in the same transaction.

INSERT INTO public.interactions (
  sender_id, receiver_id, type, target_type, target_id, created_at
)
SELECT
  demo.id              AS sender_id,
  v.receiver_id,
  'like'               AS type,
  'photo'              AS target_type,
  (SELECT ph.id FROM public.photos ph
   WHERE ph.user_id = v.receiver_id AND ph.is_primary = true
   LIMIT 1)            AS target_id,
  v.ts
FROM (VALUES
  ('a0000001-0000-0000-0000-000000000001'::uuid, NOW() - INTERVAL '1 hour'),   -- demo → Priya
  ('a0000002-0000-0000-0000-000000000002'::uuid, NOW() - INTERVAL '4 hours')   -- demo → Aaliyah
) AS v(receiver_id, ts),
LATERAL (SELECT id FROM public.users WHERE email = 'demo@divine-test.com') AS demo
WHERE NOT EXISTS (
  SELECT 1 FROM public.interactions i
  WHERE i.sender_id   = demo.id
    AND i.receiver_id = v.receiver_id
    AND i.type        = 'like'
);

COMMIT;
