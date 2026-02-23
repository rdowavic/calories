import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useSettingsStore } from '../../stores/settingsStore';
import { api } from '../../services/api';
import StatusBadge from '../../components/progress/StatusBadge';
import { formatWeight, WeeklySummary } from '@calories/shared';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function WeeklySummaryScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const unit = useSettingsStore((s) => s.unitPreference);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['weekly-summary'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/overview', { params: { period: '7d' } });
      return data as WeeklySummary;
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="lg" />
      </View>
    );
  }

  const statCards = [
    {
      icon: 'flame-outline',
      label: 'Avg Daily Calories',
      value: summary?.avg_daily_calories ? `${Math.round(Number(summary.avg_daily_calories))}` : '—',
      unit: 'cal',
    },
    {
      icon: 'calendar-outline',
      label: 'Days Logged',
      value: summary?.days_logged?.toString() ?? '—',
      unit: '/ 7',
    },
    {
      icon: 'restaurant-outline',
      label: 'Total Meals',
      value: summary?.total_logs?.toString() ?? '—',
      unit: 'meals',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.xl }]}>
          Weekly Summary
        </Text>

        {/* Stat Cards */}
        {statCards.map(({ icon, label, value, unit: unitLabel }) => (
          <View key={label} style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            <Ionicons name={icon as any} size={24} color={colors.primary} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={[typography.small, { color: colors.textSecondary }]}>{label}</Text>
              <View style={styles.statValue}>
                <Text style={[typography.h3, { color: colors.text }]}>{value}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>{unitLabel}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Macros */}
        {summary?.avg_daily_protein_g && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[typography.captionBold, { color: colors.text, marginBottom: spacing.md }]}>
              Average Daily Macros
            </Text>
            <View style={styles.macroRow}>
              {[
                { label: 'Protein', value: `${Math.round(Number(summary.avg_daily_protein_g))}g`, color: colors.proteinColor },
                { label: 'Carbs', value: `${Math.round(Number(summary.avg_daily_carbs_g))}g`, color: colors.carbsColor },
                { label: 'Fat', value: `${Math.round(Number(summary.avg_daily_fat_g))}g`, color: colors.fatColor },
              ].map(({ label, value, color }) => (
                <View key={label} style={[styles.macroCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[typography.small, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Weight Change */}
        {summary?.weight_change_kg != null && (
          <View style={[styles.weightCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md, marginTop: spacing.lg }]}>
            <Text style={[typography.captionBold, { color: colors.text }]}>Weight Change</Text>
            <Text style={[
              typography.h3,
              {
                color: Number(summary.weight_change_kg) <= 0 ? colors.success : colors.error,
                marginTop: spacing.xs,
              },
            ]}>
              {Number(summary.weight_change_kg) > 0 ? '+' : ''}
              {formatWeight(Math.abs(Number(summary.weight_change_kg)), unit)}
            </Text>
          </View>
        )}

        {/* Projection Status */}
        {summary?.projection_status && (
          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <StatusBadge status={summary.projection_status as any} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weightCard: {
    padding: 16,
    alignItems: 'center',
  },
});
