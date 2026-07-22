import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/Theme';

const BOOST_PACKAGES = [
  { count: 1, price: '$4.99', label: '1 Boost' },
  { count: 5, price: '$19.99', label: '5 Boosts' },
  { count: 10, price: '$34.99', label: '10 Boosts' },
];

export default function Boost() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [boostActive, setBoostActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (boostActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setBoostActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [boostActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleBoost = () => {
    Alert.alert(
      'Boost Activated!',
      'Your profile will be prioritized for 30 minutes.',
      [{
        text: 'OK',
        onPress: () => {
          setBoostActive(true);
          setTimeRemaining(30 * 60);
        },
      }]
    );
  };

  const isElite = user?.subscription_tier === 'elite';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⚡</Text>
          <Text style={styles.heroTitle}>Boost Your Profile</Text>
          <Text style={styles.heroSubtitle}>
            Your profile will be shown to 10x more people for the next 30 minutes
          </Text>
        </View>

        {boostActive && (
          <Card style={styles.timerCard}>
            <Text style={styles.timerLabel}>Boost Active</Text>
            <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerHint}>remaining</Text>
          </Card>
        )}

        {!boostActive && (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>No active boost</Text>
          </View>
        )}

        {isElite && (
          <Card style={styles.eliteCard}>
            <Text style={styles.eliteText}>1 free boost per week included with Divine Elite</Text>
          </Card>
        )}

        <TouchableOpacity
          style={[styles.boostButton, boostActive && styles.boostButtonDisabled]}
          onPress={handleBoost}
          activeOpacity={0.8}
          disabled={boostActive}
        >
          <Text style={styles.boostButtonText}>{boostActive ? 'Boost Active' : 'Boost Now'}</Text>
        </TouchableOpacity>

        <View style={styles.packagesSection}>
          <Text style={styles.packagesTitle}>Get More Boosts</Text>
          {BOOST_PACKAGES.map((pkg, index) => (
            <View key={index} style={styles.packageWrapper}>
              {index === 1 && (
                <View style={styles.bestValue}>
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.packageCard}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Coming Soon', `${pkg.label} for ${pkg.price} will be available at launch.`)}
              >
                <View style={styles.packageLeft}>
                  <Text style={styles.packageIcon}>⚡</Text>
                  <Text style={styles.packageLabel}>{pkg.label}</Text>
                </View>
                <Text style={styles.packagePrice}>{pkg.price}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.sm },
  closeText: { fontSize: 24, color: Colors.white },
  hero: { alignItems: 'center', marginVertical: Spacing.xl },
  heroIcon: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.accent, textAlign: 'center' },
  heroSubtitle: { fontSize: FontSize.md, color: Colors.gray[400], textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  timerCard: { backgroundColor: Colors.primaryLight, alignItems: 'center', padding: Spacing.lg, marginBottom: Spacing.lg },
  timerLabel: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  timerValue: { fontSize: FontSize.display, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.xs },
  timerHint: { fontSize: FontSize.sm, color: Colors.gray[400], marginTop: Spacing.xs },
  statusCard: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.lg },
  statusText: { fontSize: FontSize.md, color: Colors.gray[500] },
  eliteCard: { backgroundColor: Colors.primaryLight, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.accent },
  eliteText: { fontSize: FontSize.sm, color: Colors.accent, textAlign: 'center', fontWeight: FontWeight.medium },
  boostButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  boostButtonDisabled: { opacity: 0.5 },
  boostButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  packagesSection: { marginTop: Spacing.sm },
  packagesTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginBottom: Spacing.md },
  packageWrapper: { position: 'relative', marginBottom: Spacing.sm },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  packageLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  packageIcon: { fontSize: 20 },
  packageLabel: { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semibold },
  packagePrice: { fontSize: FontSize.md, color: Colors.accent, fontWeight: FontWeight.bold },
  bestValue: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  bestValueText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
});
