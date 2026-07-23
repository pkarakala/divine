import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary as AppErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { initSentry, setSentryUser, wrapRoot } from '../lib/sentry';
import { initPurchases } from '../lib/purchases';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  getNotificationData,
} from '../lib/notifications';
import { setAnalyticsUser, trackSessionStart, trackSessionEnd, flushAnalytics } from '../lib/analytics';
import { handleDeepLink } from '../lib/deepLinks';
import type { Subscription } from 'expo-notifications';

export { ErrorBoundary } from 'expo-router';

// Crash reporting first — before anything else can throw. No-op without a DSN.
initSentry();

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const router = useRouter();
  const initialize = useAuthStore(s => s.initialize);
  const user = useAuthStore(s => s.user);
  const responseListener = useRef<Subscription>(null);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setSentryUser(user?.id ?? null);
    if (!user) return;

    setAnalyticsUser(user.id);
    trackSessionStart();

    initPurchases(user.id);
    registerForPushNotifications(user.id);

    responseListener.current = addNotificationResponseListener((response) => {
      const data = getNotificationData(response);
      if (!data) return;

      if (data.type === 'message' && data.matchId) {
        router.push(`/chat/${data.matchId}` as any);
      } else if (data.type === 'match' && data.matchId) {
        router.push(`/chat/${data.matchId}` as any);
      } else if (data.type === 'like') {
        router.push('/(tabs)/likes' as any);
      } else if (data.type === 'event') {
        router.push('/(tabs)/events' as any);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        trackSessionEnd();
      } else if (nextState === 'active') {
        trackSessionStart();
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      appStateSubscription.remove();
    };
  }, [user]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OfflineBanner />
      <AppErrorBoundary>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[matchId]" options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }} />
        <Stack.Screen name="settings/edit-profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/preferences" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/notifications" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/preview" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/invite" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/boost" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/experiments" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/terms" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/privacy" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/community-guidelines" options={{ presentation: 'modal' }} />
        <Stack.Screen name="match-modal" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default wrapRoot(RootLayout);
