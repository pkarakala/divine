import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function AccountSettings() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isPaused, setIsPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleTogglePause = async (value: boolean) => {
    if (!user) return;
    setPauseLoading(true);
    try {
      await supabase.from('users').update({ is_paused: value }).eq('id', user.id);
      setIsPaused(value);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update account status.');
    } finally {
      setPauseLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(),
        },
      ]
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'This cannot be undone',
      'All your data will be permanently deleted. This includes your profile, photos, matches, and messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: () => executeDelete(),
        },
      ]
    );
  };

  const executeDelete = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      // Delete user's prompts
      await supabase.from('prompts').delete().eq('user_id', user.id);

      // Delete user's photos from storage and database
      const { data: photos } = await supabase.from('photos').select('storage_path').eq('user_id', user.id);
      if (photos) {
        const paths = photos
          .map(p => p.storage_path)
          .filter(Boolean)
          .map(url => {
            // Extract file path from public URL
            const parts = url.split('/photos/');
            return parts.length > 1 ? parts[1] : null;
          })
          .filter(Boolean) as string[];
        if (paths.length > 0) {
          await supabase.storage.from('photos').remove(paths);
        }
      }
      await supabase.from('photos').delete().eq('user_id', user.id);

      // Delete interactions
      await supabase.from('interactions').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      // Delete messages in user's matches
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        await supabase.from('messages').delete().in('match_id', matchIds);
      }

      // Delete matches
      await supabase.from('matches').delete().or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`);

      // Delete verifications
      await supabase.from('verifications').delete().eq('user_id', user.id);

      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Delete user record
      await supabase.from('users').delete().eq('id', user.id);

      // Sign out
      await signOut();
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Account</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Pause Account</Text>
              <Text style={styles.settingDescription}>
                Hide your profile from discovery. You won't appear in anyone's feed.
              </Text>
            </View>
            <Switch
              value={isPaused}
              onValueChange={handleTogglePause}
              disabled={pauseLoading}
              trackColor={{ true: Colors.accent }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete Account</Text>
            <Text style={styles.dangerDescription}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </Text>
            <Button
              title={deleteLoading ? 'Deleting...' : 'Delete My Account'}
              onPress={handleDeleteAccount}
              variant="outline"
              size="md"
              style={styles.deleteButton}
              loading={deleteLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  backBtn: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  dangerCard: {
    backgroundColor: Colors.error + '08',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    padding: Spacing.lg,
  },
  dangerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.error,
    marginBottom: Spacing.sm,
  },
  dangerDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});
