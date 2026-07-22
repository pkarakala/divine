import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { DiscoveryProfile } from '../stores/discoveryStore';
import { OrgBadge } from './ui/OrgBadge';
import { Card } from './ui/Card';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

interface ProfileCardProps {
  profile: DiscoveryProfile;
  onLikePhoto?: (photoId: string) => void;
  onLikePrompt?: (promptId: string) => void;
}

export function ProfileCard({ profile, onLikePhoto, onLikePrompt }: ProfileCardProps) {
  const { profile: userData, photos, prompts } = profile;
  const age = userData.date_of_birth
    ? Math.floor((Date.now() - new Date(userData.date_of_birth).getTime()) / 31557600000)
    : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {photos[0] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePhoto?.(photos[0].id)}>
          <View style={styles.primaryPhotoContainer}>
            <Image source={{ uri: photos[0].storage_path }} style={styles.primaryPhoto} />
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
            </View>
          </View>
        </TouchableOpacity>
      )}

      {prompts[0] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[0].id)}>
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompts[0].prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompts[0].prompt_answer}</Text>
          </Card>
        </TouchableOpacity>
      )}

      {photos[1] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePhoto?.(photos[1].id)}>
          <Image source={{ uri: photos[1].storage_path }} style={styles.secondaryPhoto} />
        </TouchableOpacity>
      )}

      {prompts[1] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[1].id)}>
          <Card style={styles.promptCard}>
            <Text style={styles.promptQuestion}>{prompts[1].prompt_question}</Text>
            <Text style={styles.promptAnswer}>{prompts[1].prompt_answer}</Text>
          </Card>
        </TouchableOpacity>
      )}

      {photos.slice(2).map((photo, index) => (
        <TouchableOpacity key={photo.id} activeOpacity={0.9} onPress={() => onLikePhoto?.(photo.id)}>
          <Image source={{ uri: photo.storage_path }} style={styles.secondaryPhoto} />
        </TouchableOpacity>
      ))}

      {prompts[2] && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onLikePrompt?.(prompts[2].id)}>
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
