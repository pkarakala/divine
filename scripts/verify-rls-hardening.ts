/**
 * Post-apply verification for supabase/migrations/0001_p0a_rls_hardening.sql.
 *
 * Signs in as a real (demo) user with the ANON key and attempts each action the
 * migration must block, plus the actions that must still work. Read-only in
 * spirit: every write attempted is either expected to be DENIED, or is reverted
 * (the users-table probe restores original values regardless of outcome).
 *
 * Run: npx tsx scripts/verify-rls-hardening.ts
 * Env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY (from .env)
 */
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env manually (no dotenv dependency in this repo)
const env: Record<string, string> = {};
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

let pass = 0;
let fail = 0;
function report(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  ok ? pass++ : fail++;
}

async function main() {
  // Demo account from constants/demo.ts (to be removed in P0-F).
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'demo@divine-test.com',
    password: 'DivineDemo2026!',
  });
  if (authError || !auth.user) {
    console.error('Could not sign in as demo user:', authError?.message);
    process.exit(1);
  }
  const me = auth.user.id;
  console.log(`Signed in as demo user ${me}\n`);

  // ---- C-1: privileged users columns must be untouchable -------------------
  {
    const { data: before } = await supabase
      .from('users')
      .select('is_verified, verification_status, subscription_tier')
      .eq('id', me)
      .single();

    const { error } = await supabase
      .from('users')
      .update({ is_verified: true, verification_status: 'approved', subscription_tier: 'elite' })
      .eq('id', me);

    if (error) {
      report('C-1 privileged UPDATE denied outright', true, error.message);
    } else {
      // Column grant didn't reject (PostgREST may route differently) — the
      // guard trigger must have reverted the values.
      const { data: after } = await supabase
        .from('users')
        .select('is_verified, verification_status, subscription_tier')
        .eq('id', me)
        .single();
      const unchanged =
        after?.is_verified === before?.is_verified &&
        after?.verification_status === before?.verification_status &&
        after?.subscription_tier === before?.subscription_tier;
      report('C-1 privileged UPDATE reverted by guard trigger', unchanged,
        `before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    }
  }

  // Allowlisted column must still work (and is restored).
  {
    const { data: before } = await supabase.from('users').select('is_paused').eq('id', me).single();
    const { error } = await supabase.from('users').update({ is_paused: true }).eq('id', me);
    const { data: after } = await supabase.from('users').select('is_paused').eq('id', me).single();
    report('C-1 allowlisted column (is_paused) still writable', !error && after?.is_paused === true,
      error?.message || '');
    await supabase.from('users').update({ is_paused: before?.is_paused ?? false }).eq('id', me);
  }

  // ---- C-2: client cannot INSERT into matches ------------------------------
  {
    const { error } = await supabase.from('matches').insert({
      user_1_id: me,
      user_2_id: '00000000-0000-0000-0000-000000000001',
      status: 'active',
    });
    report('C-2 direct matches INSERT denied', !!error, error?.message || 'insert unexpectedly succeeded');
  }

  // ---- H-2: no cross-user exact coordinates --------------------------------
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, latitude, longitude')
      .neq('user_id', me)
      .limit(5);
    // Expect zero rows (RLS filters) — an error would also be acceptable.
    const leaked = (data || []).filter(r => r.latitude !== null || r.longitude !== null);
    report('H-2 other users\' base profiles not readable', !!error || (data || []).length === 0,
      error ? error.message : `${(data || []).length} rows returned, ${leaked.length} with coords`);
  }

  {
    const { data, error } = await supabase.from('profiles_discovery').select('*').limit(3);
    const cols = data && data[0] ? Object.keys(data[0]) : [];
    const noCoords = !cols.includes('latitude') && !cols.includes('longitude');
    report('H-2 profiles_discovery readable and has no lat/long', !error && noCoords,
      error ? error.message : `${data?.length ?? 0} rows, cols: ${cols.join(',') || '(no rows)'}`);
  }

  {
    const { data, error } = await supabase.rpc('distance_bucket', {
      target_user_id: me,
      viewer_lat: 33.749,
      viewer_lng: -84.388,
    });
    report('H-2 distance_bucket RPC callable', !error,
      error ? error.message : `returned: ${JSON.stringify(data)}`);
  }

  // ---- M-5: user_scores owner-scoped, not writable --------------------------
  {
    const { data, error } = await supabase
      .from('user_scores')
      .select('user_id')
      .neq('user_id', me)
      .limit(5);
    report('M-5 other users\' scores not readable', !!error || (data || []).length === 0,
      error ? error.message : `${(data || []).length} rows`);
  }
  {
    const { error } = await supabase
      .from('user_scores')
      .upsert({ user_id: me, desirability_score: 0.99 });
    report('M-5 client score write denied', !!error, error?.message || 'write unexpectedly succeeded');
  }

  // ---- L-6: photo_moderation not client-writable ----------------------------
  {
    const { error } = await supabase.from('photo_moderation').insert({
      photo_id: '00000000-0000-0000-0000-000000000001',
      user_id: me,
      status: 'approved',
    });
    report('L-6 client moderation INSERT denied', !!error, error?.message || 'insert unexpectedly succeeded');
  }

  // ---- L-4: experiment_exposure accepted (and cleaned up) -------------------
  {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({ user_id: me, event_type: 'experiment_exposure', metadata: { verify: true } })
      .select('id')
      .single();
    report('L-4 experiment_exposure event accepted', !error, error?.message || '');
    if (data?.id) await supabase.from('analytics_events').delete().eq('id', data.id);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
