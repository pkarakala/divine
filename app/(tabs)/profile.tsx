import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { seedDatabase, clearSeedData } from '../../lib/seed';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

interface CompletionItem {
  label: string;
  done: boolean;
  weight: number;
}

function useProfileCompletion(profile: any, userId?: string) {
  const [photosCount, setPhotosCount] = useState(0);
  const [promptsCount, setPromptsCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [photosRes, promptsRes] = await Promise.all([
        supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      setPhotosCount(photosRes.count || 0);
      setPromptsCount(promptsRes.count || 0);
    })();
  }, [userId]);

  if (!profile) return { percentage: 0, items: [] };

  const items: CompletionItem[] = [
    { label: 'Display name', done: !!profile.display_name, weight: 10 },
    { label: 'At least 2 photos', done: photosCount >= 2, weight: 20 },
    { label: 'At least 3 prompts', done: promptsCount >= 3, weight: 20 },
    { label: 'Occupation', done: !!profile.occupation, weight: 10 },
    { label: 'Bio', done: !!profile.bio, weight: 10 },
    { label: 'City', done: !!profile.city, weight: 10 },
    { label: 'Date of birth', done: !!profile.date_of_birth, weight: 10 },
    { label: 'Line name', done: !!profile.line_name, weight: 5 },
    { label: 'Initiation year', done: !!profile.initiation_year, weight: 5 },
  ];

  const percentage = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  return { percentage, items };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const { percentage, items } = useProfileCompletion(profile, user?.id);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {percentage === 100 ? (
          <Card style={styles.completionCard}>
            <View style={styles.completionComplete}>
              <Text style={styles.completionCheckmark}>&#10003;</Text>
              <Text style={styles.completionCompleteText}>Profile Complete!</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.completionCard}>
            <Text style={styles.completionTitle}>Complete your profile</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.completionPercentage}>{percentage}%</Text>
            <View style={styles.missingItems}>
              {items.filter(i => !i.done).map(item => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => router.push('/settings/edit-profile' as any)}
                >
                  <Text style={styles.missingItem}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarInitial}>{profile?.display_name?.[0] || '?'}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.display_name || 'Your Name'}</Text>
            {profile?.organization && (
              <OrgBadge organization={profile.organization} showFullName size="md" />
            )}
            {profile?.chapter_name && (
              <Text style={styles.chapter}>{profile.chapter_name}</Text>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.subscription_tier || 'free'}</Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.is_verified ? '✓' : '⏳'}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile?.city || '—'}</Text>
              <Text style={styles.statLabel}>Location</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/edit-profile' as any)}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/preview' as any)}>
            <Text style={styles.settingLabel}>Preview Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/preferences' as any)}>
            <Text style={styles.settingLabel}>Preferences</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/notifications' as any)}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy & Safety</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/paywall' as any)}>
            <Text style={styles.settingLabel}>Subscription</Text>
            <Text style={styles.settingValue}>
              {user?.subscription_tier === 'free' ? 'Upgrade' : user?.subscription_tier}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/boost' as any)}>
            <Text style={styles.settingLabel}>Boost Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/account' as any)}>
            <Text style={styles.settingLabel}>Account</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/invite' as any)}>
            <Text style={styles.settingLabel}>Invite Friends</Text>
            <Text style={styles.settingValue}>✦</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Help Center</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/community-guidelines' as any)}>
            <Text style={styles.settingLabel}>Community Guidelines</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/terms' as any)}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/privacy' as any)}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        {__DEV__ && (
          <Card style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Dev Tools</Text>
            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/experiments' as any)}>
              <Text style={styles.settingLabel}>Experiments</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow} onPress={() => {
              seedDatabase().then(() => Alert.alert('Done', 'Mock data seeded!'));
            }}>
              <Text style={styles.settingLabel}>Seed Mock Data</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow} onPress={() => {
              clearSeedData().then(() => Alert.alert('Done', 'Seed data cleared!'));
            }}>
              <Text style={[styles.settingLabel, { color: Colors.error }]}>Clear Seed Data</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          size="md"
          style={styles.signOutButton}
        />

        <Text style={styles.version}>Divine v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  profileCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  chapter: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },
  settingsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.light,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
  },
  settingLabel: {
    fontSize: FontSize.md,
    color: Colors.text.primary,
  },
  settingArrow: {
    fontSize: FontSize.xl,
    color: Colors.gray[400],
  },
  settingValue: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  signOutButton: {
    marginTop: Spacing.md,
    borderColor: Colors.error,
  },
  version: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  completionCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  completionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  completionPercentage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  missingItems: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  missingItem: {
    fontSize: FontSize.sm,
    color: Colors.info,
    paddingVertical: 2,
  },
  completionComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  completionCheckmark: {
    fontSize: FontSize.xl,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  completionCompleteText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
});
