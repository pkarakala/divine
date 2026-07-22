import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useDiscoveryStore, DiscoveryProfile } from '../../stores/discoveryStore';
import { ProfileCard } from '../../components/ProfileCard';
import { ProfileCardSkeleton } from '../../components/ProfileCardSkeleton';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import { requestLocationPermission, getCurrentLocation, updateUserLocation } from '../../lib/location';
import { track, trackProfileViewStart, trackProfileViewEnd, setAnalyticsUser } from '../../lib/analytics';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticSelection } from '../../lib/haptics';

const SWIPE_THRESHOLD = 120;
const MAX_ROTATION = 10; // degrees
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Discover() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { profiles, currentIndex, dailyLikesRemaining, isLoading, fetchProfiles, interact, nextProfile, previousProfile, deleteLastPass } = useDiscoveryStore();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingInteraction, setPendingInteraction] = useState<{ targetType: 'photo' | 'prompt'; targetId: string } | null>(null);
  const [lastAction, setLastAction] = useState<'pass' | 'like' | 'rose' | null>(null);
  const [rewindAvailable, setRewindAvailable] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [rosesRemaining, setRosesRemaining] = useState(1);

  useEffect(() => {
    if (user?.id) {
      setAnalyticsUser(user.id);
      fetchProfiles(user.id);
      (async () => {
        const granted = await requestLocationPermission();
        if (granted) {
          const coords = await getCurrentLocation();
          if (coords) {
            setUserLocation(coords);
            await updateUserLocation(user.id, coords.latitude, coords.longitude);
          }
        }
      })();
    }
  }, [user?.id]);

  const currentProfile: DiscoveryProfile | undefined = profiles[currentIndex];

  useEffect(() => {
    if (currentProfile) {
      trackProfileViewEnd();
      trackProfileViewStart(currentProfile.profile.user_id);
    }
  }, [currentIndex]);

  // "Most Compatible" daily pick: same org affinity, or random fallback
  const mostCompatible = useMemo(() => {
    if (profiles.length === 0 || !profile) return null;
    // Find a profile with the same organization
    const sameOrg = profiles.find(
      (p, idx) => idx !== currentIndex && p.profile.organization === profile.organization
    );
    if (sameOrg) return sameOrg;
    // Fallback: pick a deterministic "random" profile based on today's date
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const idx = seed % profiles.length;
    return profiles[idx] !== profiles[currentIndex] ? profiles[idx] : profiles[(idx + 1) % profiles.length];
  }, [profiles, profile?.organization, currentIndex]);

  const handleMostCompatibleTap = () => {
    if (!mostCompatible) return;
    const idx = profiles.findIndex(p => p.profile.user_id === mostCompatible.profile.user_id);
    if (idx >= 0) {
      useDiscoveryStore.setState({ currentIndex: idx });
    }
  };

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
    track('like_sent', { targetUserId: currentProfile.profile.user_id });
    setShowCommentModal(false);
    setComment('');
    setPendingInteraction(null);
    if (matched) {
      hapticSuccess();
      router.push({
        pathname: '/match-modal',
        params: {
          name: currentProfile.profile.display_name,
          photo: currentProfile.photos[0]?.storage_path || '',
          matchId: currentProfile.profile.user_id,
          organization: currentProfile.profile.organization || '',
        },
      } as any);
    }
    setLastAction('like');
    setRewindAvailable(false);
    nextProfile();
  };

  const handlePass = async () => {
    if (!user || !currentProfile) return;
    track('swipe_left', { targetUserId: currentProfile.profile.user_id });
    const targetId = currentProfile.photos[0]?.id || currentProfile.prompts[0]?.id || '';
    await interact(user.id, currentProfile.profile.user_id, 'pass', 'photo', targetId);
    setLastAction('pass');
    setRewindAvailable(true);
    nextProfile();
  };

  const handleRewind = async () => {
    if (!rewindAvailable || lastAction !== 'pass' || !user) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    const prevProfile = profiles[prevIndex];
    if (!prevProfile) return;
    hapticSelection();
    await deleteLastPass(user.id, prevProfile.profile.user_id);
    previousProfile();
    setRewindAvailable(false);
    setLastAction(null);
  };

  // --- Swipe gesture state ---
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const onSwipeRight = useCallback(() => {
    if (!currentProfile) return;
    hapticMedium();
    const photoId = currentProfile.photos[0]?.id || '';
    handleLike('photo', photoId);
  }, [currentProfile, dailyLikesRemaining, user]);

  const onSwipeLeft = useCallback(() => {
    hapticLight();
    handlePass();
  }, [currentProfile, user]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3; // dampen vertical movement
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swiped right — like
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 15 });
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swiped left — pass
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 15 });
        runOnJS(onSwipeLeft)();
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    })
    .onFinalize(() => {
      // Reset after action completes
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION, 0, MAX_ROTATION]
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    );
    return { opacity: Math.min(Math.max(opacity, 0), 1) };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1]
    );
    return { opacity: Math.min(Math.max(opacity, 0), 1) };
  });

  const handleRose = async () => {
    if (!user || !currentProfile) return;
    if (rosesRemaining <= 0) {
      Alert.alert(
        "You're out of roses!",
        'Get more?',
        [
          { text: '3 roses — $4.99', onPress: () => setRosesRemaining(3) },
          { text: '12 roses — $14.99', onPress: () => setRosesRemaining(12) },
          { text: '25 roses — $24.99', onPress: () => setRosesRemaining(25) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setRosesRemaining((prev) => prev - 1);
    hapticHeavy();
    track('rose_sent', { targetUserId: currentProfile.profile.user_id });
    const targetId = currentProfile.photos[0]?.id || '';
    const { matched } = await interact(user.id, currentProfile.profile.user_id, 'rose', 'photo', targetId, 'Sent you a rose');
    if (matched) {
      hapticSuccess();
      router.push({
        pathname: '/match-modal',
        params: {
          name: currentProfile.profile.display_name,
          photo: currentProfile.photos[0]?.storage_path || '',
          matchId: currentProfile.profile.user_id,
          organization: currentProfile.profile.organization || '',
        },
      } as any);
    }
    setLastAction('rose');
    setRewindAvailable(false);
    nextProfile();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ProfileCardSkeleton />
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
        <View style={styles.headerRight}>
          <Text style={styles.rosesCount}>{'🌹'} {rosesRemaining}</Text>
          <Text style={styles.likesRemaining}>{dailyLikesRemaining} likes left</Text>
          <TouchableOpacity style={styles.boostHeaderBtn} onPress={() => router.push('/settings/boost' as any)}>
            <Text style={styles.boostHeaderIcon}>⚡</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mostCompatible && mostCompatible.profile.user_id !== currentProfile?.profile.user_id && (
        <TouchableOpacity style={styles.compatibleCard} onPress={handleMostCompatibleTap} activeOpacity={0.8}>
          <View style={styles.compatibleHeader}>
            <Text style={styles.compatibleTitle}>Your Most Compatible Today</Text>
            <View style={styles.eliteBadge}>
              <Text style={styles.eliteBadgeText}>Elite</Text>
            </View>
          </View>
          <View style={styles.compatibleContent}>
            {mostCompatible.photos[0] && (
              <Image source={{ uri: mostCompatible.photos[0].storage_path }} style={styles.compatiblePhoto} />
            )}
            <View style={styles.compatibleInfo}>
              <Text style={styles.compatibleName}>{mostCompatible.profile.display_name}</Text>
              {mostCompatible.profile.organization && (
                <OrgBadge organization={mostCompatible.profile.organization} size="sm" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.cardContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.swipeableCard, animatedCardStyle]}>
            <Animated.View style={[styles.overlayLabel, styles.likeLabel, likeOverlayStyle]}>
              <Text style={styles.likeLabelText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.overlayLabel, styles.passLabel, passOverlayStyle]}>
              <Text style={styles.passLabelText}>PASS</Text>
            </Animated.View>
            <ProfileCard
              profile={currentProfile}
              onLikePhoto={(photoId) => handleLike('photo', photoId)}
              onLikePrompt={(promptId) => handleLike('prompt', promptId)}
              viewerProfile={profile}
              viewerLocation={userLocation}
            />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionWithLabel}>
          <TouchableOpacity style={[styles.actionButton, styles.rewindButton, !rewindAvailable && styles.actionDisabled]} onPress={handleRewind} disabled={!rewindAvailable}>
            <Text style={[styles.rewindIcon, !rewindAvailable && styles.iconDisabled]}>↺</Text>
          </TouchableOpacity>
          <Text style={styles.premiumLabel}>Divine+</Text>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rosesCount: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  likesRemaining: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  boostHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostHeaderIcon: {
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  swipeableCard: {
    flex: 1,
  },
  overlayLabel: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeLabel: {
    left: 20,
    borderColor: '#4CAF50',
    transform: [{ rotateZ: '-15deg' }],
  },
  likeLabelText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#4CAF50',
  },
  passLabel: {
    right: 20,
    borderColor: '#F44336',
    transform: [{ rotateZ: '15deg' }],
  },
  passLabelText: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#F44336',
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
  rewindButton: {
    backgroundColor: Colors.white,
  },
  rewindIcon: {
    fontSize: 22,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  actionWithLabel: {
    alignItems: 'center',
    gap: 4,
  },
  premiumLabel: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  iconDisabled: {
    color: Colors.gray[400],
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
  compatibleCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  compatibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  compatibleTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  eliteBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  compatibleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatiblePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compatibleInfo: {
    marginLeft: Spacing.sm,
    gap: 4,
  },
  compatibleName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
});
