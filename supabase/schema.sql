-- Divine Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'elite')),
  gender TEXT CHECK (gender IN ('male', 'female', 'non_binary')),
  looking_for TEXT DEFAULT 'everyone' CHECK (looking_for IN ('male', 'female', 'everyone')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  date_of_birth DATE,
  bio TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  occupation TEXT,
  employer TEXT,
  education_school TEXT,
  education_degree TEXT,
  height_inches INTEGER,
  organization TEXT CHECK (organization IN (
    'alpha_phi_alpha', 'alpha_kappa_alpha', 'kappa_alpha_psi',
    'omega_psi_phi', 'delta_sigma_theta', 'phi_beta_sigma',
    'zeta_phi_beta', 'sigma_gamma_rho', 'iota_phi_theta'
  )),
  chapter_name TEXT,
  line_name TEXT,
  line_number INTEGER,
  initiation_year INTEGER,
  org_preference TEXT DEFAULT 'any_d9' CHECK (org_preference IN ('same_org', 'any_d9', 'no_preference')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts table
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prompt_question TEXT NOT NULL,
  prompt_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'voice', 'video')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactions table (likes, passes, roses)
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'pass', 'rose')),
  target_type TEXT NOT NULL CHECK (target_type IN ('photo', 'prompt')),
  target_id UUID NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seen_at TIMESTAMPTZ
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'unmatched')),
  we_met BOOLEAN,
  we_met_feedback TEXT
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'voice')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  venue TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  ticket_price DECIMAL(10,2),
  organization_filter TEXT CHECK (organization_filter IN (
    'alpha_phi_alpha', 'alpha_kappa_alpha', 'kappa_alpha_psi',
    'omega_psi_phi', 'delta_sigma_theta', 'phi_beta_sigma',
    'zeta_phi_beta', 'sigma_gamma_rho', 'iota_phi_theta', NULL
  )),
  created_by UUID REFERENCES public.users(id),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Verifications table
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('membership_card', 'letter', 'photo', 'other')),
  proof_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports/Blocks table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'fake', 'harassment', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_organization ON public.profiles(organization);
CREATE INDEX idx_profiles_city ON public.profiles(city);
CREATE INDEX idx_photos_user_id ON public.photos(user_id);
CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_interactions_sender ON public.interactions(sender_id);
CREATE INDEX idx_interactions_receiver ON public.interactions(receiver_id);
CREATE INDEX idx_interactions_pair ON public.interactions(sender_id, receiver_id);
CREATE INDEX idx_matches_users ON public.matches(user_1_id, user_2_id);
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at);
CREATE INDEX idx_events_time ON public.events(start_time);
CREATE INDEX idx_verifications_user ON public.verifications(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles are readable by authenticated users (for discovery)
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can modify own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Photos are readable by authenticated users
CREATE POLICY "Photos viewable by authenticated" ON public.photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own photos" ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own photos" ON public.photos FOR DELETE USING (auth.uid() = user_id);

-- Prompts are readable by authenticated users
CREATE POLICY "Prompts viewable by authenticated" ON public.prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- Interactions: users can create and read their own
CREATE POLICY "Users can create interactions" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can see received interactions" ON public.interactions FOR SELECT USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Matches: users can see their own matches
CREATE POLICY "Users see own matches" ON public.matches FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);
CREATE POLICY "System creates matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);
CREATE POLICY "Users can update own matches" ON public.matches FOR UPDATE USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Messages: users can read/write in their matches
CREATE POLICY "Users read match messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND (user_1_id = auth.uid() OR user_2_id = auth.uid()))
);
CREATE POLICY "Users send messages in matches" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.matches WHERE id = match_id AND status = 'active' AND (user_1_id = auth.uid() OR user_2_id = auth.uid()))
);

-- Events are publicly readable
CREATE POLICY "Events are readable" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Event RSVPs
CREATE POLICY "Users can RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own RSVPs" ON public.event_rsvps FOR SELECT USING (auth.uid() = user_id);

-- Verifications
CREATE POLICY "Users submit own verification" ON public.verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users see own verification" ON public.verifications FOR SELECT USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can report" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Function: Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number)
  VALUES (NEW.id, NEW.email, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Update last_active_at
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET last_active_at = NOW() WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Push tokens table
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- Analytics: Behavioral signals for ML matching
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'profile_view', 'profile_view_duration', 'swipe_left', 'swipe_right',
    'like_sent', 'like_received', 'rose_sent', 'message_sent',
    'message_response', 'match_created', 'we_met_yes', 'we_met_no',
    'profile_photo_tap', 'prompt_like', 'session_start', 'session_end'
  )),
  target_user_id UUID REFERENCES public.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON public.analytics_events(user_id, event_type);
CREATE INDEX idx_analytics_target ON public.analytics_events(target_user_id, event_type);
CREATE INDEX idx_analytics_time ON public.analytics_events(created_at);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own events" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);

-- User scoring cache (computed periodically)
CREATE TABLE public.user_scores (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  profile_quality FLOAT DEFAULT 0.5,
  response_rate FLOAT DEFAULT 0.5,
  activity_score FLOAT DEFAULT 0.5,
  desirability_score FLOAT DEFAULT 0.5,
  selectivity_score FLOAT DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores readable by authenticated" ON public.user_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "System updates scores" ON public.user_scores FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
