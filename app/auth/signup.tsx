import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';

export default function Signup() {
  const router = useRouter();
  const { signUpWithEmail, signInWithPhone } = useAuthStore();
  const [mode, setMode] = useState<'email' | 'phone'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneSignup = async () => {
    if (phone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    const { error: authError } = await signInWithPhone(formattedPhone);
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      router.push({ pathname: '/auth/verify', params: { phone: formattedPhone } });
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setError('Fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await signUpWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      router.replace('/onboarding/org-select');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Divine and connect with your Greek community</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.toggle}>
            <Button
              title="Phone"
              onPress={() => setMode('phone')}
              variant={mode === 'phone' ? 'primary' : 'ghost'}
              size="sm"
            />
            <Button
              title="Email"
              onPress={() => setMode('email')}
              variant={mode === 'email' ? 'primary' : 'ghost'}
              size="sm"
            />
          </View>

          {mode === 'phone' ? (
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              label="Phone Number"
              keyboardType="phone-pad"
            />
          ) : (
            <>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                label="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Min 8 characters"
                label="Password"
                secureTextEntry
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title={mode === 'phone' ? 'Send Code' : 'Create Account'}
            onPress={mode === 'phone' ? handlePhoneSignup : handleEmailSignup}
            loading={loading}
            size="lg"
          />

          <Text style={styles.consent}>
            By creating an account, you agree to our{' '}
            <Text style={styles.consentLink} onPress={() => router.push('/settings/terms' as any)}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.consentLink} onPress={() => router.push('/settings/privacy' as any)}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <Button
          title="Already have an account? Sign In"
          onPress={() => router.push('/auth/login')}
          variant="ghost"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md,
  },
  toggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  consent: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  consentLink: {
    color: Colors.accent,
    fontWeight: FontWeight.medium,
  },
});
