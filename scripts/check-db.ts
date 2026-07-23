import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

// M-8: no hardcoded prod target; require an explicit URL. Read-only script,
// but it uses the service role, so be deliberate about where it points.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
if (!SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY explicitly.');
  process.exit(1);
}
console.log(`Checking DB: ${SUPABASE_URL}`);

const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } }
);

async function main() {
  const { data: users } = await supabase.from('users').select('id, email, is_verified, gender, looking_for');
  console.log('Users:', JSON.stringify(users, null, 2));

  const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, organization');
  console.log('\nProfiles:', JSON.stringify(profiles, null, 2));

  // Check what the discovery query would return for your demo account
  const demoUser = users?.find(u => u.email === 'demo@divine-test.com');
  if (demoUser) {
    console.log('\n--- Discovery query for demo user ---');
    const { data, error } = await supabase
      .from('profiles')
      .select('*, users!inner(is_verified, looking_for, gender)')
      .eq('users.is_verified', true)
      .not('user_id', 'in', `(${demoUser.id})`)
      .limit(20);
    console.log('Results:', JSON.stringify(data?.length, null, 2));
    console.log('Error:', error);
    if (data) data.forEach(p => console.log(`  - ${p.display_name} (${p.organization})`));
  } else {
    console.log('\nDemo user (demo@divine-test.com) not found in users table');
  }
}

main().catch(console.error);
