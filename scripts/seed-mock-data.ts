import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mzjqoqyrhyseciyhaygi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var (find it in Supabase Dashboard > Settings > API)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const MOCK_USERS = [
  {
    email: 'maya@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Maya',
    date_of_birth: '1996-03-15',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Marketing Director',
    employer: 'Coca-Cola',
    organization: 'alpha_kappa_alpha',
    chapter_name: 'Alpha Beta Chapter',
    line_name: 'Lady Elegance',
    line_number: 5,
    initiation_year: 2016,
    gender: 'female',
    looking_for: 'male',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
    ],
    prompts: [
      { question: "My chapter means everything because...", answer: "It gave me 52 sisters who challenge me to be better every single day. We hold each other accountable." },
      { question: "A perfect date for me looks like...", answer: "Good food, deep conversation, and genuine laughter. Bonus points if we can stroll afterwards." },
      { question: "The way to my heart is...", answer: "Consistency, ambition, and someone who understands that service is a lifestyle, not just a resume line." },
    ],
  },
  {
    email: 'jasmine@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Jasmine',
    date_of_birth: '1997-08-22',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Software Engineer',
    employer: 'Google',
    organization: 'delta_sigma_theta',
    chapter_name: 'Gamma Tau Chapter',
    line_name: 'Crimson Queen',
    line_number: 3,
    initiation_year: 2017,
    gender: 'female',
    looking_for: 'male',
    photos: [
      'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=600',
      'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=600',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
    ],
    prompts: [
      { question: "Greek life taught me...", answer: "That sisterhood isn't just a word — it's showing up at 6am for community service and still making it look effortless." },
      { question: "At homecoming, you'll find me...", answer: "In the stands first, then at the tailgate, then strolling with my chapter. Full day, no breaks." },
      { question: "What I'm looking for in a partner...", answer: "Someone who has their own thing going on but still makes time for us. Driven but present." },
    ],
  },
  {
    email: 'zara@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Zara',
    date_of_birth: '1995-11-03',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Attorney',
    employer: 'King & Spalding',
    organization: 'zeta_phi_beta',
    chapter_name: 'Omega Zeta Chapter',
    line_name: 'Blue Flame',
    line_number: 7,
    initiation_year: 2015,
    gender: 'female',
    looking_for: 'male',
    photos: [
      'https://images.unsplash.com/photo-1611432579699-484f7990b127?w=600',
      'https://images.unsplash.com/photo-1592621385612-4d7129426394?w=600',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600',
    ],
    prompts: [
      { question: "The bond of brotherhood/sisterhood means...", answer: "Having someone call you at midnight because they need you — and going, no questions asked." },
      { question: "My proudest achievement is...", answer: "Making partner track by 29 while still finding time to mentor undergrad Zetas." },
      { question: "My love language is...", answer: "Quality time. Put the phone away, look me in the eyes, and let's actually connect." },
    ],
  },
  {
    email: 'marcus@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Marcus',
    date_of_birth: '1994-06-10',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Investment Banker',
    employer: 'Goldman Sachs',
    organization: 'alpha_phi_alpha',
    chapter_name: 'Beta Mu Chapter',
    line_name: 'Ice Cold',
    line_number: 6,
    initiation_year: 2014,
    gender: 'male',
    looking_for: 'female',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600',
    ],
    prompts: [
      { question: "I knew I found my org when...", answer: "I saw brothers who looked like me running the yard, the boardroom, and the community center all in the same week." },
      { question: "A perfect date for me looks like...", answer: "Starting with dinner at a spot we've both never tried, ending with a walk and real talk about our dreams." },
      { question: "On weekends you'll find me...", answer: "Mentoring high school kids on Saturday mornings, then catching the game with my line brothers." },
    ],
  },
  {
    email: 'darius@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Darius',
    date_of_birth: '1995-01-28',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Physician',
    employer: 'Emory Healthcare',
    organization: 'kappa_alpha_psi',
    chapter_name: 'Theta Lambda Chapter',
    line_name: 'Krimson Surgeon',
    line_number: 4,
    initiation_year: 2015,
    gender: 'male',
    looking_for: 'female',
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600',
    ],
    prompts: [
      { question: "Probate night was unforgettable because...", answer: "My mom was in the front row crying happy tears. My dad threw up the Yo. I felt like I came home." },
      { question: "The community service project closest to my heart...", answer: "Free health screenings in underserved neighborhoods. Medicine meets service — that's my purpose." },
      { question: "My line name story is...", answer: "They called me Krimson Surgeon because I was in med school crossing while other people were sleeping. Precision under pressure." },
    ],
  },
  {
    email: 'jordan@divine-test.com',
    password: 'TestUser2026!',
    display_name: 'Jordan',
    date_of_birth: '1996-09-14',
    city: 'Atlanta',
    state: 'GA',
    occupation: 'Product Manager',
    employer: 'Microsoft',
    organization: 'omega_psi_phi',
    chapter_name: 'Psi Phi Chapter',
    line_name: 'Atomic Dog',
    line_number: 2,
    initiation_year: 2016,
    gender: 'male',
    looking_for: 'female',
    photos: [
      'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=600',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600',
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600',
    ],
    prompts: [
      { question: "Greek life taught me...", answer: "Discipline. You think crossing was hard? Try building a product at Microsoft while serving as chapter basileus." },
      { question: "The way to my heart is...", answer: "Be passionate about something. I don't care what it is — just have that fire. Ambition is magnetic." },
      { question: "At homecoming, you'll find me...", answer: "Hopping on the yard at Morehouse, boots hitting the ground. If you know, you know." },
    ],
  },
];

async function seed() {
  console.log('Seeding mock data...\n');

  for (const mockUser of MOCK_USERS) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: mockUser.email,
      password: mockUser.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`  ${mockUser.display_name}: already exists, skipping`);
        continue;
      }
      console.error(`  ${mockUser.display_name}: auth error -`, authError.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`  ${mockUser.display_name}: created (${userId})`);

    // Mark as verified
    await supabase.from('users').update({
      is_verified: true,
      verification_status: 'approved',
      gender: mockUser.gender,
      looking_for: mockUser.looking_for,
    }).eq('id', userId);

    // Create profile
    await supabase.from('profiles').upsert({
      user_id: userId,
      display_name: mockUser.display_name,
      date_of_birth: mockUser.date_of_birth,
      city: mockUser.city,
      state: mockUser.state,
      occupation: mockUser.occupation,
      employer: mockUser.employer,
      organization: mockUser.organization,
      chapter_name: mockUser.chapter_name,
      line_name: mockUser.line_name,
      line_number: mockUser.line_number,
      initiation_year: mockUser.initiation_year,
      org_preference: 'any_d9',
    });

    // Create photos
    for (let i = 0; i < mockUser.photos.length; i++) {
      await supabase.from('photos').insert({
        user_id: userId,
        storage_path: mockUser.photos[i],
        order_index: i,
        is_primary: i === 0,
      });
    }

    // Create prompts
    for (let i = 0; i < mockUser.prompts.length; i++) {
      await supabase.from('prompts').insert({
        user_id: userId,
        prompt_question: mockUser.prompts[i].question,
        prompt_answer: mockUser.prompts[i].answer,
        order_index: i,
        type: 'text',
      });
    }
  }

  console.log('\nSeeding events...\n');

  const MOCK_EVENTS = [
    {
      title: 'Divine Mixer: Atlanta Launch',
      description: 'Celebrate the launch of Divine with fellow D9 members. Open bar, DJ, and networking. Must have the app to attend.',
      venue: 'The Gathering Spot',
      city: 'Atlanta',
      state: 'GA',
      start_time: '2026-08-15T20:00:00Z',
      end_time: '2026-08-16T01:00:00Z',
      capacity: 200,
      ticket_price: 25,
      organization_filter: null,
      image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    },
    {
      title: 'AKA & Alpha Speed Dating',
      description: 'Speed dating night exclusively for Alpha Kappa Alpha and Alpha Phi Alpha members. 5-minute rounds, matched connections after.',
      venue: 'Whiskey Blue at W Hotel',
      city: 'Atlanta',
      state: 'GA',
      start_time: '2026-08-22T19:00:00Z',
      end_time: '2026-08-22T22:00:00Z',
      capacity: 50,
      ticket_price: 35,
      organization_filter: null,
      image_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800',
    },
    {
      title: 'D9 Brunch & Connect',
      description: 'Sunday brunch for all Divine 9 professionals in Atlanta. Bottomless mimosas, great conversation, and genuine connections.',
      venue: 'STK Steakhouse',
      city: 'Atlanta',
      state: 'GA',
      start_time: '2026-09-07T12:00:00Z',
      end_time: '2026-09-07T15:00:00Z',
      capacity: 80,
      ticket_price: 45,
      organization_filter: null,
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    },
    {
      title: 'Sigma & Zeta Game Watch Party',
      description: 'Watch the Morehouse vs. Clark Atlanta game with Phi Beta Sigma and Zeta Phi Beta members. Blue & White only!',
      venue: 'Stats Brewpub',
      city: 'Atlanta',
      state: 'GA',
      start_time: '2026-09-20T15:00:00Z',
      end_time: '2026-09-20T19:00:00Z',
      capacity: 100,
      ticket_price: 0,
      organization_filter: null,
      image_url: 'https://images.unsplash.com/photo-1461896836934-bd45ba688509?w=800',
    },
  ];

  for (const event of MOCK_EVENTS) {
    const { error } = await supabase.from('events').insert(event);
    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        console.log(`  Event "${event.title}": already exists, skipping`);
      } else {
        console.error(`  Event "${event.title}": error -`, error.message);
      }
    } else {
      console.log(`  Event "${event.title}": created`);
    }
  }

  console.log('\nDone! Mock users and events are ready.');
}

seed().catch(console.error);
