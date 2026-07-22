import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { Colors } from '../constants/Theme';

export default function Index() {
  const router = useRouter();
  const { session, isLoading, isOnboarded } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace('/auth/welcome');
    } else if (!isOnboarded) {
      router.replace('/onboarding/org-select');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, session, isOnboarded]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
});
