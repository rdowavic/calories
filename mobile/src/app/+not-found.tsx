import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../theme';

export default function NotFoundScreen() {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={[typography.h3, { color: colors.text }]}>Page not found</Text>
      <Link href="/" style={{ marginTop: spacing.lg }}>
        <Text style={[typography.body, { color: colors.primary }]}>Go back home</Text>
      </Link>
    </View>
  );
}
