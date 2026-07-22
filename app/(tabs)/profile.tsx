import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { seedDatabase, clearSeedData } from '../../lib/seed';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();

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

          <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/settings/preferences' as any)}>
            <Text style={styles.settingLabel}>Preferences</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
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
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Help Center</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Community Guidelines</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Dev Tools</Text>
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
});
