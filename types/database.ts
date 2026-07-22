export type Organization =
  | 'alpha_phi_alpha'
  | 'alpha_kappa_alpha'
  | 'kappa_alpha_psi'
  | 'omega_psi_phi'
  | 'delta_sigma_theta'
  | 'phi_beta_sigma'
  | 'zeta_phi_beta'
  | 'sigma_gamma_rho'
  | 'iota_phi_theta';

export type Gender = 'male' | 'female' | 'non_binary';
export type LookingFor = 'male' | 'female' | 'everyone';
export type SubscriptionTier = 'free' | 'plus' | 'elite';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type InteractionType = 'like' | 'pass' | 'rose';
export type MatchStatus = 'active' | 'expired' | 'unmatched';
export type MessageType = 'text' | 'image' | 'voice';
export type OrgPreference = 'same_org' | 'any_d9' | 'no_preference';

export interface User {
  id: string;
  phone_number: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  verification_status: VerificationStatus;
  subscription_tier: SubscriptionTier;
  last_active_at: string;
  gender: Gender | null;
  looking_for: LookingFor | null;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  date_of_birth: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  occupation: string | null;
  employer: string | null;
  education_school: string | null;
  education_degree: string | null;
  height_inches: number | null;
  organization: Organization | null;
  chapter_name: string | null;
  line_name: string | null;
  line_number: number | null;
  initiation_year: number | null;
  org_preference: OrgPreference;
}

export interface Photo {
  id: string;
  user_id: string;
  storage_path: string;
  order_index: number;
  is_primary: boolean;
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  prompt_question: string;
  prompt_answer: string;
  order_index: number;
  type: 'text' | 'voice' | 'video';
  media_url: string | null;
}

export interface Interaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  type: InteractionType;
  target_type: 'photo' | 'prompt';
  target_id: string;
  comment: string | null;
  created_at: string;
  seen_at: string | null;
}

export interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  matched_at: string;
  expires_at: string;
  status: MatchStatus;
  we_met: boolean | null;
  we_met_feedback: string | null;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  media_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string | null;
  city: string;
  state: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
  ticket_price: number | null;
  organization_filter: Organization | null;
  created_by: string;
  image_url: string | null;
}

export interface Verification {
  id: string;
  user_id: string;
  organization: Organization;
  chapter_name: string;
  proof_type: 'membership_card' | 'letter' | 'photo' | 'other';
  proof_url: string;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export const ORGANIZATIONS: Record<Organization, { name: string; type: 'fraternity' | 'sorority'; founded: number; color: string }> = {
  alpha_phi_alpha: { name: 'Alpha Phi Alpha', type: 'fraternity', founded: 1906, color: '#000000' },
  alpha_kappa_alpha: { name: 'Alpha Kappa Alpha', type: 'sorority', founded: 1908, color: '#E889B8' },
  kappa_alpha_psi: { name: 'Kappa Alpha Psi', type: 'fraternity', founded: 1911, color: '#CC0000' },
  omega_psi_phi: { name: 'Omega Psi Phi', type: 'fraternity', founded: 1911, color: '#7B2D8B' },
  delta_sigma_theta: { name: 'Delta Sigma Theta', type: 'sorority', founded: 1913, color: '#CC0000' },
  phi_beta_sigma: { name: 'Phi Beta Sigma', type: 'fraternity', founded: 1914, color: '#003DA5' },
  zeta_phi_beta: { name: 'Zeta Phi Beta', type: 'sorority', founded: 1920, color: '#003DA5' },
  sigma_gamma_rho: { name: 'Sigma Gamma Rho', type: 'sorority', founded: 1922, color: '#FFD700' },
  iota_phi_theta: { name: 'Iota Phi Theta', type: 'fraternity', founded: 1963, color: '#8B4513' },
};

export const PROMPT_QUESTIONS = [
  "My chapter means everything because...",
  "Probate night was unforgettable because...",
  "Greek life taught me...",
  "The bond of brotherhood/sisterhood means...",
  "My line name story is...",
  "A perfect date for me looks like...",
  "I knew I found my org when...",
  "The community service project closest to my heart...",
  "At homecoming, you'll find me...",
  "My love language is...",
  "What I'm looking for in a partner...",
  "The thing that makes me laugh the most...",
  "My proudest achievement is...",
  "On weekends you'll find me...",
  "The way to my heart is...",
];
