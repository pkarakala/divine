import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

const STORAGE_KEY = '@divine_notification_prefs';

type NotificationPreferences = {
  newMatches: boolean;
  messages: boolean;
  likesReceived: boolean;
  eventReminders: boolean;
  marketing: boolean;
};

const DEFAULT_PREFS: NotificationPreferences = {
  newMatches: true,
  messages: true,
  likesReceived: true,
  eventReminders: true,
  marketing: false,
};

export default function NotificationSettings() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      setPrefs(JSON.parse(stored));
    }
  };

  const updatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Activity</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>New Matches</Text>
            <Text style={styles.toggleDescription}>When someone matches with you</Text>
          </View>
          <Switch
            value={prefs.newMatches}
            onValueChange={(v) => updatePref('newMatches', v)}
            trackColor={{ true: Colors.accent }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Messages</Text>
            <Text style={styles.toggleDescription}>New messages from your matches</Text>
          </View>
          <Switch
            value={prefs.messages}
            onValueChange={(v) => updatePref('messages', v)}
            trackColor={{ true: Colors.accent }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Likes Received</Text>
            <Text style={styles.toggleDescription}>When someone likes your profile</Text>
          </View>
          <Switch
            value={prefs.likesReceived}
            onValueChange={(v) => updatePref('likesReceived', v)}
            trackColor={{ true: Colors.accent }}
          />
        </View>

        <Text style={styles.sectionTitle}>Events</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Event Reminders</Text>
            <Text style={styles.toggleDescription}>Upcoming D9 events near you</Text>
          </View>
          <Switch
            value={prefs.eventReminders}
            onValueChange={(v) => updatePref('eventReminders', v)}
            trackColor={{ true: Colors.accent }}
          />
        </View>

        <Text style={styles.sectionTitle}>Other</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Marketing</Text>
            <Text style={styles.toggleDescription}>Tips, features, and promotions</Text>
          </View>
          <Switch
            value={prefs.marketing}
            onValueChange={(v) => updatePref('marketing', v)}
            trackColor={{ true: Colors.accent }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  backBtn: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[50] },
  toggleInfo: { flex: 1, marginRight: Spacing.md },
  toggleLabel: { fontSize: FontSize.md, color: Colors.text.primary, fontWeight: FontWeight.medium },
  toggleDescription: { fontSize: FontSize.sm, color: Colors.text.light, marginTop: 2 },
});
