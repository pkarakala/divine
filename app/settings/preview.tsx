import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { DiscoveryProfile } from '../../stores/discoveryStore';
import { ProfileCard } from '../../components/ProfileCard';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function PreviewProfile() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [discoveryProfile, setDiscoveryProfile] = useState<DiscoveryProfile | null>(null);

  useEffect(() => {
    loadOwnProfile();
  }, []);

  const loadOwnProfile = async () => {
    if (!user || !profile) return;
    const [photosRes, promptsRes] = await Promise.all([
      supabase.from('photos').select('*').eq('user_id', user.id).order('order_index'),
      supabase.from('prompts').select('*').eq('user_id', user.id).order('order_index'),
    ]);
    setDiscoveryProfile({
      profile,
      photos: photosRes.data || [],
      prompts: promptsRes.data || [],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile Preview</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.cardContainer}>
        {discoveryProfile && <ProfileCard profile={discoveryProfile} />}
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/settings/edit-profile' as any)}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  backBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  cardContainer: { flex: 1, paddingHorizontal: Spacing.lg },
  editButton: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
});
