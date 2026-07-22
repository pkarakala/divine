import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useMatchStore, MatchWithProfile } from '../../stores/matchStore';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

export default function Matches() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { matches, isLoading, fetchMatches } = useMatchStore();

  useEffect(() => {
    if (user?.id) fetchMatches(user.id);
  }, [user?.id]);

  const renderMatch = ({ item }: { item: MatchWithProfile }) => {
    const { other_user, last_message, unread_count } = item;
    const primaryPhoto = other_user.photos.find(p => p.is_primary) || other_user.photos[0];
    const timeAgo = getTimeAgo(last_message?.created_at || item.matched_at);

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {primaryPhoto ? (
            <Image source={{ uri: primaryPhoto.storage_path }} style={styles.avatar} />
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </View>

      {matches.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>When you and someone both like each other, you'll be able to chat here.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
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
});
