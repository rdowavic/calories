import React from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays } from 'date-fns';
import { useTheme } from '../../theme';
import { useDailyLogStore } from '../../stores/dailyLogStore';
import { useAuthStore } from '../../stores/authStore';
import { getLogsByDate, deleteLog } from '../../services/logService';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBar from '../../components/dashboard/MacroBar';
import MealItem from '../../components/dashboard/MealItem';
import RemainingBudget from '../../components/dashboard/RemainingBudget';
import QuickAddButton from '../../components/dashboard/QuickAddButton';
import { FoodLog } from '@calories/shared';

export default function HomeScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const selectedDate = useDailyLogStore((s) => s.selectedDate);
  const setSelectedDate = useDailyLogStore((s) => s.setSelectedDate);
  const dailyGoal = useDailyLogStore((s) => s.dailyGoal);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['logs', selectedDate],
    queryFn: () => getLogsByDate(selectedDate),
    staleTime: 30 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: (logId: string) => deleteLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', selectedDate] });
    },
  });

  const logs = data?.logs ?? [];
  const totals = data?.totals ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const goal = data?.goal?.daily_calories ?? user?.daily_calorie_goal ?? dailyGoal;
  const remaining = goal - totals.calories;

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const dateDisplay = isToday ? 'Today' : format(new Date(selectedDate + 'T12:00:00'), 'EEE, MMM d');

  const goToPrevDay = () => setSelectedDate(format(subDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));
  const goToNextDay = () => setSelectedDate(format(addDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'));
  const goToToday = () => setSelectedDate(format(new Date(), 'yyyy-MM-dd'));

  const handleItemPress = (log: FoodLog) => {
    const qty = Number(log.serving_qty) || 1;
    router.push({
      pathname: '/(modals)/food-detail',
      params: {
        foodId: log.external_food_id ?? `log-${log.id}`,
        source: log.food_source ?? 'manual',
        barcode: log.barcode ?? undefined,
        prefetchedFood: JSON.stringify({
          external_food_id: log.external_food_id ?? `log-${log.id}`,
          food_source: log.food_source ?? 'manual',
          food_name: log.food_name,
          brand_name: log.brand_name,
          calories: Number(log.calories) / qty,
          protein_g: Number(log.protein_g ?? 0) / qty,
          carbs_g: Number(log.carbs_g ?? 0) / qty,
          fat_g: Number(log.fat_g ?? 0) / qty,
          fiber_g: Number(log.fiber_g ?? 0) / qty,
          sugar_g: Number(log.sugar_g ?? 0) / qty,
          sodium_mg: Number(log.sodium_mg ?? 0) / qty,
          serving_qty: qty,
          serving_unit: log.serving_unit ?? 'serving',
          serving_size_g: log.serving_size_g ? Number(log.serving_size_g) : null,
          servings: [],
        }),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Date Selector */}
      <View style={[styles.dateSelector, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goToPrevDay} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text style={[typography.h4, { color: colors.text }]}>{dateDisplay}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextDay} hitSlop={8}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calorie Ring */}
        <View style={styles.ringSection}>
          <CalorieRing consumed={Math.round(totals.calories)} goal={goal} />
        </View>

        {/* Remaining Budget */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <RemainingBudget remaining={Math.round(remaining)} goal={goal} />
        </View>

        {/* Macro Bar */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <MacroBar
            protein_g={Math.round(totals.protein_g)}
            carbs_g={Math.round(totals.carbs_g)}
            fat_g={Math.round(totals.fat_g)}
          />
        </View>

        {/* Food Log - Flat List */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            FOOD LOG
          </Text>
          <View
            style={[
              styles.logCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: borderRadius.lg,
                ...(isDark
                  ? { borderWidth: 1, borderColor: colors.border }
                  : {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 2,
                    }),
              },
            ]}
          >
            {logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[typography.caption, { color: colors.textTertiary }]}>
                  Nothing logged yet
                </Text>
              </View>
            ) : (
              logs.map((log: FoodLog) => (
                <MealItem
                  key={log.id}
                  log={log}
                  onPress={() => handleItemPress(log)}
                  onDelete={() => deleteMutation.mutate(log.id)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Add FAB */}
      <QuickAddButton
        onScan={() => router.push('/(modals)/barcode-scanner')}
        onPhoto={() => router.push('/(modals)/photo-capture')}
        onSearch={() => router.push('/(modals)/food-search')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scroll: { flex: 1 },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logCard: {
    overflow: 'hidden',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
});
