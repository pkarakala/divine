import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { Colors, FontSize, FontWeight, Spacing } from '../../constants/Theme';
import { DEMO_CREDENTIALS } from '../../constants/demo';

export default function Login() {
  const router = useRouter();
  const { signInWithEmail, signInWithPhone } = useAuthStore();
  const [mode, setMode] = useState<'email' | 'phone'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneLogin = async () => {
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

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setMode('email');
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    const { error: authError } = await signInWithEmail(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
    setLoading(false);
    if (authError) {
      setError(authError);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your Divine account</Text>
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
                placeholder="Your password"
                label="Password"
                secureTextEntry
              />
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            title={mode === 'phone' ? 'Send Code' : 'Sign In'}
            onPress={mode === 'phone' ? handlePhoneLogin : handleEmailLogin}
            loading={loading}
            size="lg"
          />
        </View>

        <View style={styles.footer}>
          <Button
            title="Try Demo Account"
            onPress={handleDemoLogin}
            variant="ghost"
            loading={loading}
          />
          <Button
            title="Don't have an account? Sign Up"
            onPress={() => router.push('/auth/signup')}
            variant="ghost"
          />
        </View>
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
  forgotPassword: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'right',
  },
  footer: {
    gap: Spacing.xs,
    alignItems: 'center',
  },
});
