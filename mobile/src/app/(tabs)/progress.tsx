import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getWeightEntries } from '../../services/weightService';
import { getProjection } from '../../services/projectionService';
import WeightChart from '../../components/progress/WeightChart';
import ProjectionCard from '../../components/progress/ProjectionCard';
import TodayImpact from '../../components/progress/TodayImpact';
import Button from '../../components/common/Button';
import { formatWeight } from '@calories/shared';

type Period = '30d' | '90d' | '1y';

export default function ProgressScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [period, setPeriod] = useState<Period>('30d');
  const unit = useSettingsStore((s) => s.unitPreference);
  const user = useAuthStore((s) => s.user);

  const { data: weightData } = useQuery({
    queryKey: ['weight', period],
    queryFn: () => getWeightEntries(period),
    retry: false,
  });

  const { data: projection } = useQuery({
    queryKey: ['projections'],
    queryFn: getProjection,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const periods: { key: Period; label: string }[] = [
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '1y', label: '1Y' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[typography.h3, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight Chart Section */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h4, { color: colors.text }]}>Weight Trend</Text>
            <View style={styles.periodToggle}>
              {periods.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setPeriod(key)}
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: period === key ? colors.primary : colors.surface,
                      borderRadius: borderRadius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.smallBold,
                      { color: period === key ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {weightData?.entries && weightData.entries.length > 0 && (
            <WeightChart
              entries={weightData.entries.map((e) => ({ date: e.logged_date, weight_kg: Number(e.weight_kg) }))}
              rollingAverage={weightData.rolling_average ?? []}
              goalWeight={user?.goal_weight_kg ? Number(user.goal_weight_kg) : 70}
              unit={unit}
            />
          )}

          <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.lg }}>
            <Button
              title="Log Weight"
              onPress={() => router.push('/(modals)/weight-log')}
              variant="secondary"
              size="md"
              icon="scale-outline"
            />
          </View>
        </View>

        {/* Projection Section */}
        {projection?.projected_goal_date && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
              Projection
            </Text>
            <ProjectionCard
              projectedDate={projection.projected_goal_date}
              status={projection.status}
              daysRemaining={projection.days_remaining}
            />
            <View style={{ marginTop: spacing.md }}>
              <TodayImpact impactDays={projection.today_impact_days} />
            </View>
          </View>
        )}

        {/* Stats Row */}
        {projection?.rolling_7day_avg_calories != null && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>
              This Week
            </Text>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
                <Text style={[typography.small, { color: colors.textSecondary }]}>Avg Daily Cal</Text>
                <Text style={[typography.numberSmall, { color: colors.text }]}>
                  {Math.round(projection.rolling_7day_avg_calories)}
                </Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
                <Text style={[typography.small, { color: colors.textSecondary }]}>Daily Deficit</Text>
                <Text style={[typography.numberSmall, { color: colors.primary }]}>
                  {Math.round(projection.required_daily_deficit)}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
});
