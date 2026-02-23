import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { signOut } from '../../services/authService';
import { updateProfile } from '../../services/userService';
import UnitToggle from '../../components/common/UnitToggle';
import {
  formatWeight,
  calculateGoalCalories,
  WeightLossSpeed,
} from '@calories/shared';

export default function ProfileScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { unitPreference, setUnitPreference, theme, setTheme } = useSettingsStore();

  // Goal editing state
  const [goalWeight, setGoalWeight] = useState(
    user?.goal_weight_kg ? String(user.goal_weight_kg) : ''
  );
  const [speed, setSpeed] = useState<WeightLossSpeed>('aggressive');

  // Recompute whenever goal weight or speed changes
  const goalInfo = useMemo(() => {
    const gw = parseFloat(goalWeight);
    if (!gw || !user?.tdee || !user?.current_weight_kg || !user?.gender) return null;
    return calculateGoalCalories(
      Number(user.tdee),
      user.gender,
      Number(user.current_weight_kg),
      gw,
      speed
    );
  }, [goalWeight, speed, user?.tdee, user?.current_weight_kg, user?.gender]);

  const updateMutation = useMutation({
    mutationFn: (data: { goal_weight_kg: number; daily_calorie_goal: number }) =>
      updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      Alert.alert('Goal Updated', `Your daily calorie goal is now ${updatedUser.daily_calorie_goal} cal.`);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    },
  });

  const handleSaveGoal = () => {
    const gw = parseFloat(goalWeight);
    if (!gw || !goalInfo) {
      Alert.alert('Invalid', 'Please enter a valid goal weight.');
      return;
    }
    updateMutation.mutate({
      goal_weight_kg: gw,
      daily_calorie_goal: goalInfo.daily_calories,
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut().then(() => router.replace('/(auth)/sign-in')) },
    ]);
  };

  const speedOptions: Array<{ key: WeightLossSpeed; label: string; desc: string }> = [
    { key: 'moderate', label: 'Steady', desc: '~0.5 kg/wk' },
    { key: 'fast', label: 'Fast', desc: '~0.75 kg/wk' },
    { key: 'aggressive', label: 'Max', desc: '~1 kg/wk' },
  ];

  const menuItems = [
    {
      icon: 'book-outline' as const,
      label: 'My Recipes',
      onPress: () => router.push('/(modals)/recipe-editor'),
    },
    {
      icon: 'heart-outline' as const,
      label: 'Favorite Foods',
      onPress: () => router.push('/(modals)/food-search'),
    },
    {
      icon: 'document-text-outline' as const,
      label: 'Weekly Summary',
      onPress: () => router.push('/(modals)/weekly-summary'),
    },
    {
      icon: 'download-outline' as const,
      label: 'Export Data (CSV)',
      onPress: () => {},
    },
  ];

  const themeOptions: Array<{ key: 'light' | 'dark' | 'system'; label: string }> = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' },
  ];

  const hasGoalChanged = goalInfo &&
    (goalInfo.daily_calories !== user?.daily_calorie_goal ||
     parseFloat(goalWeight) !== Number(user?.goal_weight_kg));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        <View style={[styles.userSection, { paddingHorizontal: spacing.lg }]}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[typography.h2, { color: colors.primary }]}>
                {user?.display_name?.[0] ?? '?'}
              </Text>
            </View>
          )}
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.md }]}>
            {user?.display_name}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
        </View>

        {/* Weight Loss Goal */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            WEIGHT LOSS GOAL
          </Text>
          <View style={[styles.goalsCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            {/* Current Weight */}
            <View style={styles.goalRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Current Weight</Text>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {user?.current_weight_kg ? formatWeight(Number(user.current_weight_kg), unitPreference) : '—'}
              </Text>
            </View>
            <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />

            {/* Goal Weight - Editable */}
            <View style={styles.goalRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Goal Weight</Text>
              <View style={styles.goalInputRow}>
                <TextInput
                  value={goalWeight}
                  onChangeText={setGoalWeight}
                  keyboardType="decimal-pad"
                  style={[
                    typography.bodyBold,
                    styles.goalInput,
                    {
                      color: colors.primary,
                      borderColor: colors.border,
                      borderRadius: borderRadius.sm,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>kg</Text>
              </View>
            </View>
            <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />

            {/* Loss Speed */}
            <View style={{ paddingVertical: 12 }}>
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
                Loss Speed
              </Text>
              <View style={styles.speedRow}>
                {speedOptions.map(({ key, label, desc }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setSpeed(key)}
                    style={[
                      styles.speedPill,
                      {
                        backgroundColor: speed === key ? colors.primary : colors.background,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                  >
                    <Text style={[
                      typography.captionBold,
                      { color: speed === key ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {label}
                    </Text>
                    <Text style={[
                      { fontSize: 10 },
                      { color: speed === key ? 'rgba(255,255,255,0.7)' : colors.textTertiary },
                    ]}>
                      {desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Computed Result */}
            {goalInfo && (
              <>
                <View style={[styles.goalDivider, { backgroundColor: colors.border }]} />
                <View style={{ paddingVertical: 12 }}>
                  <View style={styles.goalRow}>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>Daily Calorie Goal</Text>
                    <Text style={[typography.h4, { color: colors.primary }]}>
                      {goalInfo.daily_calories} cal
                    </Text>
                  </View>
                  {goalInfo.weeks_to_goal > 0 && (
                    <Text style={[typography.small, { color: colors.textTertiary, marginTop: 4 }]}>
                      Losing ~{goalInfo.weekly_loss_kg} kg/week — reach goal in ~{goalInfo.weeks_to_goal} weeks
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* Save Button */}
            {hasGoalChanged && goalInfo && (
              <TouchableOpacity
                onPress={handleSaveGoal}
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.primary, borderRadius: borderRadius.sm },
                ]}
                disabled={updateMutation.isPending}
              >
                <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                  {updateMutation.isPending ? 'Saving...' : 'Set Goal'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            FEATURES
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            {menuItems.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.6}>
                  <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                  <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.md }]}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                {i < menuItems.length - 1 && (
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            PREFERENCES
          </Text>

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>Units</Text>
            <UnitToggle value={unitPreference} onChange={setUnitPreference} />
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.sm }]}>Theme</Text>
            <View style={styles.themeRow}>
              {themeOptions.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTheme(key)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: theme === key ? colors.primary : colors.surface,
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                >
                  <Text style={[
                    typography.captionBold,
                    { color: theme === key ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.signOutButton, { borderColor: colors.error, borderRadius: borderRadius.md }]}
            activeOpacity={0.6}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[typography.bodyBold, { color: colors.error, marginLeft: spacing.sm }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: { flex: 1 },
  userSection: {
    alignItems: 'center',
    paddingTop: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalsCard: {
    padding: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInput: {
    width: 80,
    textAlign: 'right',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  goalDivider: {
    height: 1,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  saveButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuDivider: {
    height: 1,
    marginLeft: 52,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
  },
});
