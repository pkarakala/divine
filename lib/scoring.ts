import { supabase } from './supabase';
import type { Profile } from '../types/database';

export interface RankedProfile {
  userId: string;
  score: number;
  reciprocalLikelihood: number;
}

interface EloState {
  rating: number;
  gender: string;
  percentile: number;
}

const BASE_RATING = 1000;
const K_FACTOR = 32;

// Gender-specific percentile thresholds derived from research:
// Women match at 8.4x the rate of men (SwipeStats, 294M swipes)
// So a woman's "average" incoming like rate is ~8x a man's
const GENDER_BASELINES = {
  male: { avgLikesReceived: 5, avgLikeRate: 0.053, matchRate: 0.053 },
  female: { avgLikesReceived: 42, avgLikeRate: 0.444, matchRate: 0.444 },
  non_binary: { avgLikesReceived: 15, avgLikeRate: 0.15, matchRate: 0.15 },
};

function getGenderBaseline(gender: string | null) {
  if (gender === 'female') return GENDER_BASELINES.female;
  if (gender === 'non_binary') return GENDER_BASELINES.non_binary;
  return GENDER_BASELINES.male;
}

function computeGenderNormalizedPercentile(
  likesReceived: number,
  totalExposures: number,
  gender: string | null
): number {
  const baseline = getGenderBaseline(gender);
  if (totalExposures === 0) return 0.5;

  const userLikeRate = likesReceived / totalExposures;
  const ratio = userLikeRate / baseline.avgLikeRate;

  return sigmoid(Math.log(ratio + 0.01) * 1.5);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function eloUpdate(rating: number, expected: number, actual: number, k: number = K_FACTOR): number {
  return rating + k * (actual - expected);
}

function computeEloRating(
  likesReceived: number,
  passesReceived: number,
  likesReceivedFromHighRated: number,
  totalLikesReceived: number,
  gender: string | null
): number {
  let rating = BASE_RATING;
  const totalImpressions = likesReceived + passesReceived;
  if (totalImpressions === 0) return rating;

  const likeRate = likesReceived / totalImpressions;
  const baseline = getGenderBaseline(gender);
  const relativePerformance = likeRate / baseline.avgLikeRate;

  rating += Math.log2(Math.max(relativePerformance, 0.1)) * 100;

  if (totalLikesReceived > 0) {
    const highRatedRatio = likesReceivedFromHighRated / totalLikesReceived;
    rating += highRatedRatio * 150;
  }

  return Math.max(500, Math.min(1500, rating));
}

function computeReciprocalLikelihood(
  viewerPercentile: number,
  targetPercentile: number,
  targetSelectivity: number,
  sharedAttributes: number
): number {
  const percentileGap = Math.abs(viewerPercentile - targetPercentile);
  const tierMatch = Math.max(0, 1 - percentileGap * 2);

  const selectivityFactor = targetSelectivity > 0.7
    ? (viewerPercentile > 0.6 ? 0.8 : 0.3)
    : 0.6;

  const attributeBoost = sharedAttributes * 0.1;

  return Math.min(0.95, tierMatch * 0.4 + selectivityFactor * 0.35 + attributeBoost * 0.25);
}

function countSharedAttributes(viewer: Profile, candidate: any): number {
  let shared = 0;
  if (viewer.city && viewer.city === candidate.city) shared++;
  if (viewer.organization && viewer.organization === candidate.organization) shared += 2;
  if (viewer.org_preference === 'same_org' && viewer.organization === candidate.organization) shared++;
  return shared;
}

interface ScoringContext {
  viewerElo: EloState;
  targetElo: EloState;
  reciprocalLikelihood: number;
  conversationLikelihood: number;
  demographics: {
    sameCity: boolean;
    sameOrg: boolean;
    ageGap: number;
    orgPreferenceMatch: boolean;
  };
  targetQuality: {
    profileCompleteness: number;
    responseRate: number;
    conversationRate: number;
  };
  mutualSignals: {
    targetLikedViewer: boolean;
    targetViewedViewer: boolean;
  };
  exposureCount: number;
}

const WEIGHTS = {
  reciprocal: 30,
  conversationPotential: 20,
  tierMatch: 15,
  demographics: 15,
  mutualSignals: 10,
  profileQuality: 5,
  exposurePenalty: 5,
};

function computeFinalScore(ctx: ScoringContext): number {
  let score = 0;
  const maxScore = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

  score += ctx.reciprocalLikelihood * WEIGHTS.reciprocal;

  score += ctx.conversationLikelihood * WEIGHTS.conversationPotential;

  const percentileGap = Math.abs(ctx.viewerElo.percentile - ctx.targetElo.percentile);
  const tierMatchScore = Math.max(0, 1 - percentileGap * 2.5);
  score += tierMatchScore * WEIGHTS.tierMatch;

  let demoScore = 0;
  if (ctx.demographics.sameCity) demoScore += 0.35;
  if (ctx.demographics.sameOrg) demoScore += 0.3;
  demoScore += Math.max(0, 1 - ctx.demographics.ageGap / 12) * 0.2;
  if (ctx.demographics.orgPreferenceMatch) demoScore += 0.15;
  score += demoScore * WEIGHTS.demographics;

  if (ctx.mutualSignals.targetLikedViewer) score += WEIGHTS.mutualSignals;
  else if (ctx.mutualSignals.targetViewedViewer) score += WEIGHTS.mutualSignals * 0.3;

  score += ctx.targetQuality.profileCompleteness * WEIGHTS.profileQuality * 0.5;
  score += ctx.targetQuality.responseRate * WEIGHTS.profileQuality * 0.5;

  const exposurePenalty = Math.min(1, ctx.exposureCount / 50) * WEIGHTS.exposurePenalty;
  score -= exposurePenalty;

  return Math.min(99, Math.max(1, Math.round((score / maxScore) * 100)));
}

export async function rankProfiles(
  viewerId: string,
  viewerProfile: Profile,
  candidateUserIds: string[]
): Promise<RankedProfile[]> {
  if (candidateUserIds.length === 0) return [];

  const { data: viewerUser } = await supabase
    .from('users')
    .select('gender')
    .eq('id', viewerId)
    .single();

  // user_scores SELECT is owner-scoped now (0001_p0a_rls_hardening.sql, M-5):
  // only the viewer's own row is readable. Candidate scores fall back to the
  // 0.5 defaults below; candidate-aware ranking belongs server-side.
  const { data: scores } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', viewerId);

  const { data: candidateUsers } = await supabase
    .from('users')
    .select('id, gender')
    .in('id', candidateUserIds);

  const { data: incomingLikes } = await supabase
    .from('interactions')
    .select('sender_id')
    .eq('receiver_id', viewerId)
    .in('sender_id', candidateUserIds)
    .in('type', ['like', 'rose']);

  const { data: candidateProfiles } = await supabase
    .from('profiles_discovery')
    .select('user_id, city, organization, date_of_birth, org_preference')
    .in('user_id', candidateUserIds);

  const { data: exposureCounts } = await supabase
    .from('interactions')
    .select('receiver_id')
    .in('receiver_id', candidateUserIds)
    .in('type', ['like', 'rose']);

  const likedViewerSet = new Set(incomingLikes?.map(l => l.sender_id) || []);
  const scoreMap = new Map(scores?.map(s => [s.user_id, s]) || []);
  const profileMap = new Map(candidateProfiles?.map(p => [p.user_id, p]) || []);
  const genderMap = new Map(candidateUsers?.map(u => [u.id, u.gender]) || []);

  const exposureMap: Record<string, number> = {};
  exposureCounts?.forEach(e => {
    exposureMap[e.receiver_id] = (exposureMap[e.receiver_id] || 0) + 1;
  });

  const viewerScoreData = scoreMap.get(viewerId);
  const viewerGender = viewerUser?.gender || 'male';
  const viewerPercentile = viewerScoreData
    ? computeGenderNormalizedPercentile(
        Math.round(viewerScoreData.desirability_score * 20),
        20,
        viewerGender
      )
    : 0.5;

  const viewerElo: EloState = {
    rating: BASE_RATING + (viewerPercentile - 0.5) * 400,
    gender: viewerGender,
    percentile: viewerPercentile,
  };

  const viewerAge = viewerProfile.date_of_birth
    ? Math.floor((Date.now() - new Date(viewerProfile.date_of_birth).getTime()) / 31557600000)
    : 28;

  const ranked: RankedProfile[] = candidateUserIds.map(candidateId => {
    const candidateScoreData = scoreMap.get(candidateId);
    const candidateProfile = profileMap.get(candidateId);
    const candidateGender = genderMap.get(candidateId) || 'male';

    const targetPercentile = candidateScoreData
      ? computeGenderNormalizedPercentile(
          Math.round(candidateScoreData.desirability_score * 20),
          20,
          candidateGender
        )
      : 0.5;

    const targetElo: EloState = {
      rating: BASE_RATING + (targetPercentile - 0.5) * 400,
      gender: candidateGender,
      percentile: targetPercentile,
    };

    const sharedAttrs = candidateProfile
      ? countSharedAttributes(viewerProfile, candidateProfile)
      : 0;

    const reciprocalLikelihood = computeReciprocalLikelihood(
      viewerPercentile,
      targetPercentile,
      candidateScoreData?.selectivity_score ?? 0.5,
      sharedAttrs
    );

    const conversationLikelihood = (candidateScoreData?.response_rate ?? 0.5) *
      reciprocalLikelihood;

    const candidateAge = candidateProfile?.date_of_birth
      ? Math.floor((Date.now() - new Date(candidateProfile.date_of_birth).getTime()) / 31557600000)
      : 28;

    const ctx: ScoringContext = {
      viewerElo,
      targetElo,
      reciprocalLikelihood,
      conversationLikelihood,
      demographics: {
        sameCity: candidateProfile?.city === viewerProfile.city,
        sameOrg: candidateProfile?.organization === viewerProfile.organization,
        ageGap: Math.abs(viewerAge - candidateAge),
        orgPreferenceMatch:
          viewerProfile.org_preference === 'same_org'
            ? candidateProfile?.organization === viewerProfile.organization
            : true,
      },
      targetQuality: {
        profileCompleteness: candidateScoreData?.profile_quality ?? 0.5,
        responseRate: candidateScoreData?.response_rate ?? 0.5,
        conversationRate: conversationLikelihood,
      },
      mutualSignals: {
        targetLikedViewer: likedViewerSet.has(candidateId),
        targetViewedViewer: false,
      },
      exposureCount: exposureMap[candidateId] || 0,
    };

    return {
      userId: candidateId,
      score: computeFinalScore(ctx),
      reciprocalLikelihood,
    };
  });

  ranked.sort((a, b) => {
    const jitterA = a.score + (Math.random() * 3 - 1.5);
    const jitterB = b.score + (Math.random() * 3 - 1.5);
    return jitterB - jitterA;
  });

  return ranked;
}
