import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

const REWARD_TIERS = [
  { invites: 3, reward: '1 free boost' },
  { invites: 5, reward: '1 week Divine+' },
  { invites: 10, reward: '1 month Divine+' },
];

export default function InviteFriends() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [inviteCount] = useState(0);

  const referralLink = `https://divine.app/invite/${user?.id || 'unknown'}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Divine — the exclusive dating app for the Divine 9. Use my invite link: ${referralLink}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share at this time.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>✦</Text>
          <Text style={styles.heroTitle}>Invite Friends</Text>
          <Text style={styles.heroSubtitle}>
            Share Divine with your line sisters, brothers, and friends. Earn rewards for every friend who joins.
          </Text>
        </View>

        <Card style={styles.statsCard}>
          <Text style={styles.statsCount}>{inviteCount}</Text>
          <Text style={styles.statsLabel}>friends invited</Text>
          <Text style={styles.statsHint}>Invite 3 friends to unlock 1 free boost</Text>
        </Card>

        <Card style={styles.linkCard}>
          <Text style={styles.linkLabel}>Your referral link</Text>
          <Text style={styles.linkText}>{referralLink}</Text>
        </Card>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
          <Text style={styles.shareButtonText}>Share Invite Link</Text>
        </TouchableOpacity>

        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsTitle}>Rewards</Text>
          {REWARD_TIERS.map((tier, index) => (
            <Card key={index} style={styles.rewardCard}>
              <View style={styles.rewardRow}>
                <View style={styles.rewardLeft}>
                  <View style={[styles.rewardBadge, inviteCount >= tier.invites && styles.rewardBadgeUnlocked]}>
                    <Text style={[styles.rewardBadgeText, inviteCount >= tier.invites && styles.rewardBadgeTextUnlocked]}>
                      {tier.invites}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.rewardInvites}>{tier.invites} invites</Text>
                    <Text style={styles.rewardName}>{tier.reward}</Text>
                  </View>
                </View>
                <Text style={styles.rewardStatus}>
                  {inviteCount >= tier.invites ? '✓' : `${tier.invites - inviteCount} more`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.sm },
  closeText: { fontSize: 24, color: Colors.text.primary },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  heroIcon: { fontSize: 48, color: Colors.accent, marginBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  heroSubtitle: { fontSize: FontSize.md, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  statsCard: { alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.md },
  statsCount: { fontSize: FontSize.display, fontWeight: FontWeight.bold, color: Colors.accent },
  statsLabel: { fontSize: FontSize.md, color: Colors.text.secondary, marginTop: Spacing.xs },
  statsHint: { fontSize: FontSize.sm, color: Colors.text.light, marginTop: Spacing.sm },
  linkCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  linkLabel: { fontSize: FontSize.sm, color: Colors.text.light, marginBottom: Spacing.xs },
  linkText: { fontSize: FontSize.sm, color: Colors.text.primary, fontWeight: FontWeight.medium },
  shareButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  shareButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  rewardsSection: { marginTop: Spacing.sm },
  rewardsTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md },
  rewardCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rewardBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardBadgeUnlocked: { backgroundColor: Colors.accent },
  rewardBadgeText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text.light },
  rewardBadgeTextUnlocked: { color: Colors.primary },
  rewardInvites: { fontSize: FontSize.sm, color: Colors.text.light },
  rewardName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  rewardStatus: { fontSize: FontSize.sm, color: Colors.text.light, fontWeight: FontWeight.medium },
});
