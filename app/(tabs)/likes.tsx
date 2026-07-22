import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Interaction, Profile, Photo } from '../../types/database';

interface LikeItem extends Interaction {
  sender_profile: Profile;
  sender_photo: Photo | null;
}

export default function Likes() {
  const { user } = useAuthStore();
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchLikes();
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

  const renderItem = ({ item }: { item: LikeItem }) => (
    <TouchableOpacity style={styles.likeCard} activeOpacity={0.8}>
      <View style={styles.photoContainer}>
        {item.sender_photo ? (
          <Image source={{ uri: item.sender_photo.storage_path }} style={styles.photo} />
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

      {likes.length === 0 && !isLoading ? (
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
});
