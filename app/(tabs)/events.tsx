import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { OrgBadge } from '../../components/ui/OrgBadge';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';
import type { Event } from '../../types/database';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    setEvents(data || []);
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <Card style={styles.eventCard} padding={false}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.eventImage} />
      )}
      <View style={styles.eventContent}>
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
          <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventLocation}>{item.venue ? `${item.venue} • ` : ''}{item.city}, {item.state}</Text>

        {item.organization_filter && (
          <OrgBadge organization={item.organization_filter} size="sm" showFullName />
        )}

        <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.eventFooter}>
          {item.ticket_price ? (
            <Text style={styles.price}>${item.ticket_price}</Text>
          ) : (
            <Text style={styles.free}>Free</Text>
          )}
          {item.capacity && (
            <Text style={styles.capacity}>{item.capacity} spots</Text>
          )}
        </View>

        <Button title="RSVP" onPress={() => {}} variant="secondary" size="sm" />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>D9 events near you</Text>
      </View>

      {events.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No upcoming events</Text>
          <Text style={styles.emptySubtitle}>Check back soon for mixers, speed dating, and chapter events.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  eventCard: {
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateChip: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  eventTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  eventLocation: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
  },
  eventDescription: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  free: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  capacity: {
    fontSize: FontSize.sm,
    color: Colors.text.light,
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
  },
});
