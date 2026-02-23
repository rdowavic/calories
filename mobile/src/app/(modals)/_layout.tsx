import { Stack } from 'expo-router';
import { useTheme } from '../../theme';

export default function ModalsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="barcode-scanner" options={{ title: 'Scan Barcode', headerShown: false }} />
      <Stack.Screen name="photo-capture" options={{ title: 'Take Photo', headerShown: false }} />
      <Stack.Screen name="food-detail" options={{ title: 'Food Detail' }} />
      <Stack.Screen name="food-search" options={{ title: 'Search Food' }} />
      <Stack.Screen name="recipe-editor" options={{ title: 'Recipe' }} />
      <Stack.Screen name="weight-log" options={{ title: 'Log Weight' }} />
      <Stack.Screen name="weekly-summary" options={{ title: 'Weekly Summary' }} />
    </Stack>
  );
}
