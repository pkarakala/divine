import { router } from 'expo-router';

export function handleDeepLink(url: string) {
  const parsed = new URL(url);
  const path = parsed.pathname;

  if (path.startsWith('/chat/')) {
    const matchId = path.replace('/chat/', '');
    router.push(`/chat/${matchId}` as any);
  } else if (path.startsWith('/invite/')) {
    const referrerId = path.replace('/invite/', '');
  } else if (path === '/likes') {
    router.push('/(tabs)/likes' as any);
  } else if (path === '/events') {
    router.push('/(tabs)/events' as any);
  }
}
