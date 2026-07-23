import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { DiscoveryProfile } from '../stores/discoveryStore';
import { CachedImage } from './ui/CachedImage';
import { OrgBadge } from './ui/OrgBadge';
import { Card } from './ui/Card';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../constants/Theme';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

interface ProfileCardProps {
  profile: DiscoveryProfile;
  onLikePhoto?: (photoId: string) => void;
  onLikePrompt?: (promptId: string) => void;
  viewerProfile?: Profile | null;
  viewerLocation?: { latitude: number; longitude: number } | null;
}

function getActivityStatus(lastActiveAt?: string): { label: string; showDot: boolean } | null {
  if (!lastActiveAt) return null;
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours <= 1) return { label: 'Active now', showDot: true };
  if (hours <= 24) return { label: 'Active today', showDot: false };
  if (hours <= 168) return { label: 'Active this week', showDot: false };
  return null;
}

function calculateCompatibility(viewer: Profile, target: Profile, photos: any[], prompts: any[]): number {
  let score = 0;
  if (viewer.city && target.city && viewer.city.toLowerCase() === target.city.toLowerCase()) score += 20;
  if (viewer.organization && target.organization && viewer.organization === target.organization) score += 30;
  if (viewer.date_of_birth && target.date_of_birth) {
    const viewerAge = Math.floor((Date.now() - new Date(viewer.date_of_birth).getTime()) / 31557600000);
    const targetAge = Math.floor((Date.now() - new Date(target.date_of_birth).getTime()) / 31557600000);
    if (Math.abs(viewerAge - targetAge) <= 3) score += 15;
  }
  if (viewer.org_preference === 'same_org' && target.organization === viewer.organization) score += 15;
  else if (viewer.org_preference === 'any_d9' && target.organization) score += 15;
  else if (viewer.org_preference === 'no_preference') score += 15;
  if (prompts.length > 0) score += 10;
  if (photos.length > 1) score += 10;
  return Math.min(score, 99);
}

export function ProfileCard({ profile, onLikePhoto, onLikePrompt, viewerProfile, viewerLocation }: ProfileCardProps) {
  const { profile: userData, photos, prompts, last_active_at } = profile;
  const age = userData.date_of_birth
    ? Math.floor((Date.now() - new Date(userData.date_of_birth).getTime()) / 31557600000)
    : null;

  const activity = getActivityStatus(last_active_at);

  // Exact coordinates are no longer client-readable (RLS hardening, H-2).
  // The distance_bucket RPC computes distance server-side from the target's
  // stored location and returns only a coarse bucket like "5-10 miles".
  const [distanceBucket, setDistanceBucket] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!viewerLocation) {
      setDistanceBucket(null);
      return;
    }
    supabase
      .rpc('distance_bucket', {
        target_user_id: userData.user_id,
        viewer_lat: viewerLocation.latitude,
        viewer_lng: viewerLocation.longitude,
      })
      .then(({ data }) => {
        if (!cancelled) setDistanceBucket(typeof data === 'string' ? data : null);
      });
    return () => {
      cancelled = true;
    };
  }, [userData.user_id, viewerLocation?.latitude, viewerLocation?.longitude]);

  const compatibility = viewerProfile
    ? calculateCompatibility(viewerProfile, userData, photos, prompts)
    : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {photos[0] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePhoto?.(photos[0].id)}>
          <View style={styles.primaryPhotoContainer} accessibilityLabel={`${userData.display_name}, age ${age || 'unknown'}${userData.occupation ? ', ' + userData.occupation : ''}${userData.city ? ', ' + userData.city : ''}`}>
            <CachedImage uri={photos[0].storage_path} style={styles.primaryPhoto} />
            {compatibility !== null && compatibility > 0 && (
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>{compatibility}% Compatible</Text>
              </View>
            )}
            <View style={styles.photoOverlay}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{userData.display_name}, {age}</Text>
                {userData.organization && <OrgBadge organization={userData.organization} size="sm" />}
              </View>
              {userData.occupation && (
                <Text style={styles.occupation}>{userData.occupation}{userData.employer ? ` at ${userData.employer}` : ''}</Text>
              )}
              {userData.city && (
                <Text style={styles.location}>{userData.city}, {userData.state}</Text>
              )}
              {distanceBucket !== null && (
                <Text style={styles.distance}>{distanceBucket} away</Text>
              )}
              {activity && (
                <View style={styles.activityRow}>
                  {activity.showDot && <View style={styles.activeDot} />}
                  <Text style={styles.activityText}>{activity.label}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {prompts[0] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[0].id)} accessibilityLabel={`Prompt: ${prompts[0].prompt_question} Answer: ${prompts[0].prompt_answer}`}>
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompts[0].prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompts[0].prompt_answer}</Text>
          </Card>
        </TouchableOpacity>
      )}

      {photos[1] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePhoto?.(photos[1].id)}>
          <CachedImage uri={photos[1].storage_path} style={styles.secondaryPhoto} />
        </TouchableOpacity>
      )}

      {prompts[1] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[1].id)} accessibilityLabel={`Prompt: ${prompts[1].prompt_question} Answer: ${prompts[1].prompt_answer}`}>
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompts[1].prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompts[1].prompt_answer}</Text>
          </Card>
        </TouchableOpacity>
      )}

      {photos.slice(2).map((photo, index) => (
        <TouchableOpacity key={photo.id} activeOpacity={0.9} onPress={() => onLikePhoto?.(photo.id)}>
          <CachedImage uri={photo.storage_path} style={styles.secondaryPhoto} />
        </TouchableOpacity>
      ))}

      {prompts[2] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[2].id)} accessibilityLabel={`Prompt: ${prompts[2].prompt_question} Answer: ${prompts[2].prompt_answer}`}>
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompts[2].prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompts[2].prompt_answer}</Text>
          </Card>
        </TouchableOpacity>
      )}

      {userData.chapter_name && (
        <Card style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Greek Life</Text>
          {userData.organization && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Organization</Text>
              <OrgBadge organization={userData.organization} showFullName size="sm" />
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Chapter</Text>
            <Text style={styles.detailValue}>{userData.chapter_name}</Text>
          </View>
          {userData.line_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Line Name</Text>
              <Text style={styles.detailValue}>{userData.line_name}</Text>
            </View>
          )}
          {userData.initiation_year && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Initiated</Text>
              <Text style={styles.detailValue}>{userData.initiation_year}</Text>
            </View>
          )}
        </Card>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  primaryPhotoContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  primaryPhoto: {
    width: '100%',
    height: '100%',
  },
  compatibilityBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  compatibilityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingTop: Spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  occupation: {
    fontSize: FontSize.md,
    color: Colors.white,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  location: {
    fontSize: FontSize.sm,
    color: Colors.white,
    marginTop: 2,
    opacity: 0.8,
  },
  distance: {
    fontSize: FontSize.sm,
    color: Colors.white,
    marginTop: 2,
    opacity: 0.8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  activityText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  promptCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  promptQuestion: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptAnswer: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  secondaryPhoto: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  detailsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  detailsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  detailLabel: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  bottomPadding: {
    height: 120,
  },
});
