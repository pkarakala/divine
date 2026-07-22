import { View, Text, StyleSheet, Image } from 'react-native';
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
          <Text style={styles.tagline}>Where Greek Love Begins</Text>
          <Text style={styles.subtitle}>
            The exclusive dating app for the Divine 9.{'\n'}
            Verified members only.
          </Text>
        </View>

        <View style={styles.orgs}>
          <Text style={styles.orgsText}>
            ΑΦΑ • ΑΚΑ • ΚΑΨ • ΩΨΦ • ΔΣΘ • ΦΒΣ • ΖΦΒ • ΣΓΡ • ΙΦΘ
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            title="Create Account"
            onPress={() => router.push('/auth/signup')}
            variant="primary"
            size="lg"
          />
          <Button
            title="Sign In"
            onPress={() => router.push('/auth/login')}
            variant="outline"
            size="lg"
            style={styles.signInButton}
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
    fontSize: FontSize.display + 16,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.medium,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray[400],
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  orgs: {
    alignItems: 'center',
  },
  orgsText: {
    fontSize: FontSize.sm,
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  buttons: {
    gap: Spacing.md,
  },
  signInButton: {
    borderColor: Colors.accent,
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
  },
});
