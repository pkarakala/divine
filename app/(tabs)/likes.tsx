import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CachedImage } from '../../components/ui/CachedImage';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Interaction, Profile, Photo } from '../../types/database';

interface LikeItem extends Interaction {
  sender_profile: Profile;
  sender_photo: Photo | null;
}

interface StandoutProfile {
  profile: Profile;
  photo: Photo | null;
  score: number;
}

export default function Likes() {
  const { user } = useAuthStore();
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [standouts, setStandouts] = useState<StandoutProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchLikes();
      fetchStandouts();
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLikes(), fetchStandouts()]);
    setRefreshing(false);
  }, [user?.id]);

  const fetchLikes = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('receiver_id', user.id)
      .in('type', ['like', 'rose'])
      .is('seen_at', null)
      .order('created_at', { ascending: false });

    if (!interactions) {
      setIsLoading(false);
      return;
    }

    const items: LikeItem[] = await Promise.all(
      interactions.map(async (interaction) => {
        const [profileRes, photoRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', interaction.sender_id).single(),
          supabase.from('photos').select('*').eq('user_id', interaction.sender_id).eq('is_primary', true).single(),
        ]);
        return {
          ...interaction,
          sender_profile: profileRes.data!,
          sender_photo: photoRes.data,
        };
      })
    );

    setLikes(items);
    setIsLoading(false);
  };

  const fetchStandouts = async () => {
    if (!user) return;

    const { data: myInteractions } = await supabase
      .from('interactions')
      .select('receiver_id')
      .eq('sender_id', user.id);

    const excludeIds = [user.id, ...(myInteractions?.map(i => i.receiver_id) || [])];

    const { data: scores } = await supabase
      .from('user_scores')
      .select('user_id, desirability_score')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .order('desirability_score', { ascending: false })
      .limit(5);

    if (scores && scores.length > 0) {
      const profiles: StandoutProfile[] = await Promise.all(
        scores.map(async (s) => {
          const [profileRes, photoRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', s.user_id).single(),
            supabase.from('photos').select('*').eq('user_id', s.user_id).eq('is_primary', true).single(),
          ]);
          return { profile: profileRes.data!, photo: photoRes.data, score: s.desirability_score };
        })
      );
      setStandouts(profiles);
      return;
    }

    const { data: fallbackProfiles } = await supabase
      .from('profiles')
      .select('*')
      .not('user_id', 'in', `(${excludeIds.join(',')})`)
      .limit(10);

    if (!fallbackProfiles || fallbackProfiles.length === 0) return;

    const withPhotoCounts = await Promise.all(
      fallbackProfiles.map(async (p) => {
        const [photoCountRes, promptCountRes, photoRes] = await Promise.all([
          supabase.from('photos').select('*', { count: 'exact', head: true }).eq('user_id', p.user_id),
          supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('user_id', p.user_id),
          supabase.from('photos').select('*').eq('user_id', p.user_id).eq('is_primary', true).single(),
        ]);
        const completeness = (photoCountRes.count || 0) + (promptCountRes.count || 0);
        return { profile: p, photo: photoRes.data, score: completeness };
      })
    );

    withPhotoCounts.sort((a, b) => b.score - a.score);
    setStandouts(withPhotoCounts.slice(0, 5));
  };

  const renderStandoutCard = ({ item }: { item: StandoutProfile }) => (
    <TouchableOpacity style={styles.standoutCard} activeOpacity={0.8}>
      {item.photo ? (
        <CachedImage uri={item.photo.storage_path} style={styles.standoutPhoto} />
      ) : (
        <View style={[styles.standoutPhoto, styles.placeholderPhoto]}>
          <Text style={styles.placeholderText}>{item.profile.display_name?.[0]}</Text>
        </View>
      )}
      <View style={styles.standoutOverlay}>
        <Text style={styles.standoutName} numberOfLines={1}>{item.profile.display_name}</Text>
        {item.profile.organization && (
          <OrgBadge organization={item.profile.organization} size="sm" />
        )}
      </View>
      <TouchableOpacity style={styles.roseButton} activeOpacity={0.7}>
        <Text style={styles.roseButtonText}>🌹</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderStandouts = () => {
    if (standouts.length === 0) return null;

    return (
      <View style={styles.standoutsSection}>
        <View style={styles.standoutsHeader}>
          <Text style={styles.standoutsTitle}>◆ Standouts</Text>
          <View style={styles.eliteBadge}>
            <Text style={styles.eliteBadgeText}>Divine Elite</Text>
          </View>
        </View>
        <FlatList
          data={standouts}
          renderItem={renderStandoutCard}
          keyExtractor={(item) => item.profile.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.standoutsList}
        />
      </View>
    );
  };

  const renderItem = ({ item }: { item: LikeItem }) => (
    <TouchableOpacity style={styles.likeCard} activeOpacity={0.8}>
      <View style={styles.photoContainer}>
        {item.sender_photo ? (
          <CachedImage uri={item.sender_photo.storage_path} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholderPhoto]}>
            <Text style={styles.placeholderText}>{item.sender_profile.display_name?.[0]}</Text>
          </View>
        )}
        {item.type === 'rose' && (
          <View style={styles.roseBadge}>
            <Text>🌹</Text>
          </View>
        )}
      </View>
      <View style={styles.likeInfo}>
        <Text style={styles.likeName}>{item.sender_profile.display_name}</Text>
        {item.sender_profile.organization && (
          <OrgBadge organization={item.sender_profile.organization} size="sm" />
        )}
        {item.comment && (
          <Text style={styles.likeComment} numberOfLines={2}>"{item.comment}"</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Likes</Text>
        <Text style={styles.count}>{likes.length} people liked you</Text>
      </View>

      {isLoading ? (
        <View style={styles.grid}>
          <View style={styles.row}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.likeCard}>
                <Skeleton width="100%" height={180} borderRadius={BorderRadius.lg} />
              </View>
            ))}
          </View>
        </View>
      ) : likes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>♥</Text>
          <Text style={styles.emptyTitle}>No likes yet</Text>
          <Text style={styles.emptySubtitle}>When someone likes your profile, they'll appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={renderStandouts}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
        />
      )}
    </SafeAreaView>
  );
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
  count: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  grid: {
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  likeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  placeholderPhoto: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.gray[400],
  },
  roseBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeInfo: {
    padding: Spacing.sm,
    gap: 4,
  },
  likeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  likeComment: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
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
    color: Colors.gray[300],
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
  standoutsSection: {
    marginBottom: Spacing.lg,
  },
  standoutsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  standoutsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  eliteBadge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  eliteBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  standoutsList: {
    gap: Spacing.sm,
  },
  standoutCard: {
    width: 140,
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.gray[200],
  },
  standoutPhoto: {
    width: '100%',
    height: '100%',
  },
  standoutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    paddingTop: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 4,
  },
  standoutName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  roseButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roseButtonText: {
    fontSize: 14,
  },
});
