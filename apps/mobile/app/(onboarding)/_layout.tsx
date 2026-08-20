import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="notification-permissions" />
      <Stack.Screen name="caregiver-intro" />
    </Stack>
  );
}
