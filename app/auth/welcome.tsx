import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.logo}>Divine</Text>
          <View style={styles.taglineContainer}>
            <View style={styles.taglineLine} />
            <Text style={styles.tagline}>Where Divine Connections Begin.</Text>
            <View style={styles.taglineLine} />
          </View>
          <Text style={styles.subtitle}>
            Exclusive dating for verified{'\n'}Black Divine Nine members.
          </Text>
        </View>

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>✓</Text>
            <Text style={styles.badgeText}>VERIFIED</Text>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>♥</Text>
            <Text style={styles.badgeText}>MEANINGFUL</Text>
          </View>
          <View style={styles.badgeDivider} />
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>⟐</Text>
            <Text style={styles.badgeText}>EXCLUSIVE</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            title="JOIN THE WAITLIST"
            onPress={() => router.push('/auth/signup')}
            variant="outline"
            size="lg"
            style={styles.waitlistButton}
            textStyle={styles.waitlistButtonText}
          />
          <Button
            title="I have an account"
            onPress={() => router.push('/auth/login')}
            variant="ghost"
            size="md"
            textStyle={styles.signInText}
          />
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
    paddingBottom: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  taglineLine: {
    height: 1,
    width: 20,
    backgroundColor: Colors.accent,
    opacity: 0.5,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSize.lg,
    color: Colors.gray[400],
    textAlign: 'center',
    marginTop: Spacing.xl,
    lineHeight: 26,
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badge: {
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    fontSize: 18,
    color: Colors.accent,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.gray[400],
    letterSpacing: 1.5,
  },
  badgeDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray[700],
  },
  buttons: {
    gap: Spacing.md,
  },
  waitlistButton: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  waitlistButtonText: {
    color: Colors.accent,
    letterSpacing: 2,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  signInText: {
    color: Colors.gray[400],
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});
