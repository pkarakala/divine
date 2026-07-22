export interface ActivityTier {
  tier: 'highly_active' | 'active' | 'somewhat_active' | 'inactive' | 'dormant';
  boostMultiplier: number;
}

export function getActivityTier(lastActiveAt: string | null): ActivityTier {
  if (!lastActiveAt) return { tier: 'dormant', boostMultiplier: 0.1 };

  const hoursSince = (Date.now() - new Date(lastActiveAt).getTime()) / 3600000;

  if (hoursSince < 1) return { tier: 'highly_active', boostMultiplier: 1.5 };
  if (hoursSince < 24) return { tier: 'active', boostMultiplier: 1.2 };
  if (hoursSince < 72) return { tier: 'somewhat_active', boostMultiplier: 1.0 };
  if (hoursSince < 168) return { tier: 'inactive', boostMultiplier: 0.5 };
  return { tier: 'dormant', boostMultiplier: 0.1 };
}

export function applyActivityMultipliers(
  profiles: Array<{ userId: string; score: number; lastActiveAt: string | null }>
): Array<{ userId: string; score: number; activityTier: string }> {
  return profiles
    .map(p => {
      const tier = getActivityTier(p.lastActiveAt);
      return {
        userId: p.userId,
        score: Math.round(p.score * tier.boostMultiplier),
        activityTier: tier.tier,
      };
    })
    .filter(p => p.activityTier !== 'dormant');
}
