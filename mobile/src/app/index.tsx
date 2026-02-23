import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useUserProfileStore } from '../stores/userProfileStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnboarded = useUserProfileStore((s) => s.isOnboarded);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!isOnboarded) {
    return <Redirect href="/(onboarding)/chat" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
