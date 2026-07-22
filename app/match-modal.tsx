import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { OrgBadge } from '../components/ui/OrgBadge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../constants/Theme';
import { useAuthStore } from '../stores/authStore';
import type { Organization } from '../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = 120;

export default function MatchModal() {
  const router = useRouter();
  const { name, photo, matchId, organization } = useLocalSearchParams<{
    name: string;
    photo: string;
    matchId: string;
    organization: string;
  }>();
  const { profile } = useAuthStore();

  // Animation values
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const leftPhotoX = useSharedValue(-SCREEN_WIDTH / 2);
  const rightPhotoX = useSharedValue(SCREEN_WIDTH / 2);

  useEffect(() => {
    // Fade in overlay
    opacity.value = withTiming(1, { duration: 300 });
    // Scale in the title
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    // Slide in photos
    leftPhotoX.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 80 }));
    rightPhotoX.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 80 }));
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const leftPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftPhotoX.value }],
  }));

  const rightPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightPhotoX.value }],
  }));

  const handleSendMessage = () => {
    router.dismiss();
    if (matchId) {
      router.push(`/chat/${matchId}` as any);
    }
  };

  const handleKeepSwiping = () => {
    router.dismiss();
  };

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      <View style={styles.content}>
        <Animated.View style={titleStyle}>
          <Text style={styles.matchText}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {name} liked each other
          </Text>
        </Animated.View>

        <View style={styles.photosContainer}>
          <Animated.View style={[styles.photoWrapper, leftPhotoStyle]}>
            <View style={styles.photoCircle}>
              {profile?.display_name ? (
                <Text style={styles.photoInitial}>{profile.display_name[0]}</Text>
              ) : (
                <Text style={styles.photoInitial}>?</Text>
              )}
            </View>
            <Text style={styles.photoName}>You</Text>
          </Animated.View>

          <View style={styles.heartContainer}>
            <Text style={styles.heartIcon}>♥</Text>
          </View>

          <Animated.View style={[styles.photoWrapper, rightPhotoStyle]}>
            <View style={styles.photoCircle}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.matchPhoto} />
              ) : (
                <Text style={styles.photoInitial}>{name?.[0] || '?'}</Text>
              )}
            </View>
            <Text style={styles.photoName}>{name}</Text>
            {organization && (
              <OrgBadge organization={organization as Organization} size="sm" />
            )}
          </Animated.View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Send a Message"
            onPress={handleSendMessage}
            size="lg"
            style={styles.messageButton}
          />
          <Button
            title="Keep Swiping"
            onPress={handleKeepSwiping}
            variant="ghost"
            size="md"
            style={styles.swipeButton}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  matchText: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  photoWrapper: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  photoCircle: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: Colors.primaryLight,
    borderWidth: 3,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  matchPhoto: {
    width: '100%',
    height: '100%',
  },
  photoInitial: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  photoName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.inverse,
  },
  heartContainer: {
    marginBottom: Spacing.xl,
  },
  heartIcon: {
    fontSize: 32,
    color: Colors.accent,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  messageButton: {
    backgroundColor: Colors.accent,
  },
  swipeButton: {
    borderColor: 'transparent',
  },
});
