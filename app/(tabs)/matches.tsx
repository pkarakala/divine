import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore, MatchWithProfile } from '../../stores/matchStore';
import { CachedImage } from '../../components/ui/CachedImage';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { MatchListSkeleton } from '../../components/MatchListSkeleton';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import { hapticLight } from '../../lib/haptics';

export default function Matches() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { matches, isLoading, fetchMatches } = useMatchStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchMatches(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!matches.length) return;
    const totalUnread = matches.reduce((sum, m) => sum + (m.unread_count || 0), 0);
    if (totalUnread > 0) {
      AccessibilityInfo.announceForAccessibility(`${totalUnread} unread ${totalUnread === 1 ? 'message' : 'messages'}`);
    }
  }, [matches.length]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await fetchMatches(user.id);
    hapticLight();
    setRefreshing(false);
  }, [user?.id]);

  // Filter out expired matches without messages
  const activeMatches = useMemo(() => {
    const now = new Date();
    return matches.filter((match) => {
      if (!match.last_message && match.expires_at) {
        const expiresAt = new Date(match.expires_at);
        if (expiresAt < now) return false;
      }
      return true;
    });
  }, [matches]);

  // "We Met" eligible: matches older than 7 days that have messages
  const weMetEligible = useMemo(() => {
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return activeMatches.filter((match) => {
      if (!match.last_message) return false;
      if (match.we_met !== null) return false;
      const matchedAt = new Date(match.matched_at);
      return now.getTime() - matchedAt.getTime() > sevenDaysMs;
    });
  }, [activeMatches]);

  const sortedMatches = useMemo(() => {
    return [...activeMatches].sort((a, b) => {
      const aIsMyTurn = !a.last_message || a.last_message.sender_id !== user?.id;
      const bIsMyTurn = !b.last_message || b.last_message.sender_id !== user?.id;
      if (aIsMyTurn && !bIsMyTurn) return -1;
      if (!aIsMyTurn && bIsMyTurn) return 1;
      const aTime = a.last_message?.created_at || a.matched_at;
      const bTime = b.last_message?.created_at || b.matched_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [activeMatches, user]);

  const renderMatch = ({ item }: { item: MatchWithProfile }) => {
    const { other_user, last_message, unread_count } = item;
    const primaryPhoto = other_user.photos.find(p => p.is_primary) || other_user.photos[0];
    const timeAgo = getTimeAgo(last_message?.created_at || item.matched_at);
    const expiryText = getExpiryText(item);
    const isNew = !last_message;
    const isMyTurn = isNew || last_message.sender_id !== user?.id;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {primaryPhoto ? (
            <CachedImage uri={primaryPhoto.storage_path} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{other_user.profile.display_name?.[0]}</Text>
            </View>
          )}
          {unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread_count}</Text>
            </View>
          )}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName}>{other_user.profile.display_name}</Text>
            <Text style={styles.matchTime}>{timeAgo}</Text>
          </View>
          {other_user.profile.organization && (
            <OrgBadge organization={other_user.profile.organization} size="sm" />
          )}
          <Text style={styles.lastMessage} numberOfLines={1}>
            {last_message ? last_message.content : 'Say hello! 👋'}
          </Text>
          {isNew ? (
            <View style={[styles.turnChip, styles.turnChipNew]}>
              <Text style={styles.turnChipNewText}>New! Say hi</Text>
            </View>
          ) : isMyTurn ? (
            <View style={[styles.turnChip, styles.turnChipYours]}>
              <Text style={styles.turnChipYoursText}>Your turn</Text>
            </View>
          ) : (
            <View style={[styles.turnChip, styles.turnChipWaiting]}>
              <Text style={styles.turnChipWaitingText}>Waiting...</Text>
            </View>
          )}
          {expiryText && (
            <Text style={styles.expiryText}>{expiryText}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderWeMetPrompts = () => {
    if (weMetEligible.length === 0) return null;

    return (
      <View style={styles.weMetSection}>
        <Text style={styles.weMetSectionTitle}>Check in</Text>
        {weMetEligible.map((match) => (
          <TouchableOpacity
            key={`wemet-${match.id}`}
            style={styles.weMetCard}
            onPress={() =>
              router.push(
                `/settings/we-met?matchId=${match.id}&name=${encodeURIComponent(match.other_user.profile.display_name)}`
              )
            }
            activeOpacity={0.7}
          >
            <Text style={styles.weMetEmoji}>☕</Text>
            <View style={styles.weMetInfo}>
              <Text style={styles.weMetText}>
                Did you meet {match.other_user.profile.display_name}?
              </Text>
              <Text style={styles.weMetSubtext}>Let us know how it went</Text>
            </View>
            <Text style={styles.weMetArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </View>

      {isLoading ? (
        <MatchListSkeleton />
      ) : activeMatches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>When you and someone both like each other, you'll be able to chat here.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedMatches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderWeMetPrompts}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
        />
      )}
    </SafeAreaView>
  );
}

function getExpiryText(match: MatchWithProfile): string | null {
  if (match.last_message || !match.expires_at) return null;
  const now = new Date();
  const expiresAt = new Date(match.expires_at);
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  if (diffDays > 0) return `Expires in ${diffDays}d ${remainingHours}h`;
  return `Expires in ${diffHours}h`;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.gray[400],
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  matchInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    gap: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  matchTime: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
  },
  lastMessage: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
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
    lineHeight: 22,
  },
  expiryText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  weMetSection: {
    marginBottom: Spacing.md,
  },
  weMetSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weMetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  weMetEmoji: {
    fontSize: 24,
  },
  weMetInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  weMetText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  weMetSubtext: {
    fontSize: FontSize.xs,
    color: Colors.text.light,
    marginTop: 2,
  },
  weMetArrow: {
    fontSize: 24,
    color: Colors.text.light,
    fontWeight: FontWeight.bold,
  },
  turnChip: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  turnChipNew: {
    backgroundColor: `${Colors.success}18`,
  },
  turnChipNewText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
  turnChipYours: {
    backgroundColor: `${Colors.accent}25`,
  },
  turnChipYoursText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  turnChipWaiting: {
    backgroundColor: Colors.gray[100],
  },
  turnChipWaitingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text.light,
  },
});
