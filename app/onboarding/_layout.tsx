import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="org-select" />
      <Stack.Screen name="profile-basics" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="prompts" />
      <Stack.Screen name="verification" />
    </Stack>
  );
}
