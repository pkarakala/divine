import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useDiscoveryStore, DiscoveryProfile } from '../../stores/discoveryStore';
import { ProfileCard } from '../../components/ProfileCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function Discover() {
  const { user } = useAuthStore();
  const { profiles, currentIndex, dailyLikesRemaining, isLoading, fetchProfiles, interact, nextProfile } = useDiscoveryStore();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingInteraction, setPendingInteraction] = useState<{ targetType: 'photo' | 'prompt'; targetId: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfiles(user.id);
    }
  }, [user?.id]);

  const currentProfile: DiscoveryProfile | undefined = profiles[currentIndex];

  const handleLike = (targetType: 'photo' | 'prompt', targetId: string) => {
    if (dailyLikesRemaining <= 0) {
      Alert.alert('Daily Limit Reached', 'Upgrade to Divine+ for unlimited likes.');
      return;
    }
    setPendingInteraction({ targetType, targetId });
    setShowCommentModal(true);
  };

  const handleSendLike = async () => {
    if (!user || !currentProfile || !pendingInteraction) return;
    const { matched } = await interact(
      user.id,
      currentProfile.profile.user_id,
      'like',
      pendingInteraction.targetType,
      pendingInteraction.targetId,
      comment
    );
    setShowCommentModal(false);
    setComment('');
    setPendingInteraction(null);
    if (matched) {
      Alert.alert("It's a Match!", `You and ${currentProfile.profile.display_name} liked each other!`);
    }
    nextProfile();
  };

  const handlePass = async () => {
    if (!user || !currentProfile) return;
    const targetId = currentProfile.photos[0]?.id || currentProfile.prompts[0]?.id || '';
    await interact(user.id, currentProfile.profile.user_id, 'pass', 'photo', targetId);
    nextProfile();
  };

  const handleRose = async () => {
    if (!user || !currentProfile) return;
    const targetId = currentProfile.photos[0]?.id || '';
    const { matched } = await interact(user.id, currentProfile.profile.user_id, 'rose', 'photo', targetId, 'Sent you a rose');
    if (matched) {
      Alert.alert("It's a Match!", `You and ${currentProfile.profile.display_name} liked each other!`);
    }
    nextProfile();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>You've seen everyone</Text>
          <Text style={styles.emptySubtitle}>Check back later for new profiles in your area.</Text>
          <Button title="Refresh" onPress={() => user && fetchProfiles(user.id)} variant="outline" style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Divine</Text>
        <Text style={styles.likesRemaining}>{dailyLikesRemaining} likes left</Text>
      </View>

      <View style={styles.cardContainer}>
        <ProfileCard
          profile={currentProfile}
          onLikePhoto={(photoId) => handleLike('photo', photoId)}
          onLikePrompt={(promptId) => handleLike('prompt', promptId)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePass}>
          <Text style={styles.passIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.roseButton]} onPress={handleRose}>
          <Text style={styles.roseIcon}>🌹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={() => handleLike('photo', currentProfile.photos[0]?.id || '')}>
          <Text style={styles.likeIcon}>♥</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCommentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a comment</Text>
            <Text style={styles.modalSubtitle}>Profiles with comments get 3x more responses</Text>
            <Input
              value={comment}
              onChangeText={setComment}
              placeholder="Say something about what caught your eye..."
              multiline
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Button title="Send Like" onPress={handleSendLike} size="md" />
              <Button title="Skip comment" onPress={handleSendLike} variant="ghost" size="sm" />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  logo: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  likesRemaining: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent,
  },
  roseButton: {
    backgroundColor: Colors.white,
  },
  passIcon: {
    fontSize: 24,
    color: Colors.gray[500],
    fontWeight: FontWeight.bold,
  },
  likeIcon: {
    fontSize: 28,
    color: Colors.white,
  },
  roseIcon: {
    fontSize: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  modalActions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
