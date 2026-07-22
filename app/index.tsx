import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { session, isOnboarded } = useAuthStore();

  if (!session) {
    return <Redirect href="/auth/welcome" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding/org-select" />;
  }

  return <Redirect href="/(tabs)" />;
}
