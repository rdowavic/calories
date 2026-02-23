import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format, parseISO, subDays, isAfter } from 'date-fns';
import { kgToLb } from '@calories/shared';
import { useTheme } from '../../theme';
import Card from '../common/Card';

type Period = '30d' | '90d' | '1y';

interface WeightChartProps {
  entries: Array<{ date: string; weight_kg: number }>;
  rollingAverage: Array<{ date: string; weight_kg: number }>;
  goalWeight: number;
  unit: 'metric' | 'imperial';
}

const PERIOD_DAYS: Record<Period, number> = {
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

const screenWidth = Dimensions.get('window').width;

export default function WeightChart({
  entries,
  rollingAverage,
  goalWeight,
  unit,
}: WeightChartProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [period, setPeriod] = useState<Period>('30d');

  const convertWeight = (kg: number): number =>
    unit === 'imperial' ? kgToLb(kg) : Math.round(kg * 10) / 10;

  const unitLabel = unit === 'imperial' ? 'lb' : 'kg';

  const filteredData = useMemo(() => {
    const cutoff = subDays(new Date(), PERIOD_DAYS[period]);
    const filtered = entries.filter((e) => {
      try {
        return isAfter(parseISO(e.date), cutoff);
      } catch {
        return false;
      }
    });
    return filtered.length > 0 ? filtered : entries.slice(-7);
  }, [entries, period]);

  const filteredAverage = useMemo(() => {
    const cutoff = subDays(new Date(), PERIOD_DAYS[period]);
    const filtered = rollingAverage.filter((e) => {
      try {
        return isAfter(parseISO(e.date), cutoff);
      } catch {
        return false;
      }
    });
    return filtered.length > 0 ? filtered : rollingAverage.slice(-7);
  }, [rollingAverage, period]);

  const labels = useMemo(() => {
    if (filteredData.length === 0) return [''];
    const step = Math.max(1, Math.floor(filteredData.length / 5));
    return filteredData.map((e, i) => {
      if (i % step === 0 || i === filteredData.length - 1) {
        try {
          return format(parseISO(e.date), 'M/d');
        } catch {
          return '';
        }
      }
      return '';
    });
  }, [filteredData]);

  const weightValues = filteredData.map((e) => convertWeight(e.weight_kg));
  const avgValues = filteredAverage.map((e) => convertWeight(e.weight_kg));
  const goalLine = convertWeight(goalWeight);

  // Ensure we have at least 2 data points for the chart library
  const safeWeightValues = weightValues.length >= 2
    ? weightValues
    : weightValues.length === 1
      ? [weightValues[0], weightValues[0]]  // Duplicate single point so chart renders
      : [0, 0];
  const safeAvgValues = avgValues.length >= 2 ? avgValues : safeWeightValues;
  const safeLabels = labels.length >= 2 ? labels : labels.length === 1 ? [labels[0], ''] : ['', ''];

  const datasets = [
    {
      data: safeWeightValues,
      color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // accent/indigo
      strokeWidth: 2,
    },
    {
      data: safeAvgValues,
      color: (opacity = 1) => colors.primary,
      strokeWidth: 3,
    },
    {
      // Goal weight dashed line (simulated as a flat dataset)
      data: safeWeightValues.map(() => goalLine),
      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity * 0.5})`,
      strokeWidth: 1,
      withDots: false,
    },
  ];

  const chartWidth = screenWidth - spacing.lg * 2 - spacing.lg * 2;

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[typography.h4, { color: colors.text }]}>
          Weight Trend
        </Text>
        <Text style={[typography.small, { color: colors.textTertiary }]}>
          Goal: {goalLine} {unitLabel}
        </Text>
      </View>

      {/* Period toggle */}
      <View
        style={[
          styles.periodRow,
          {
            marginTop: spacing.md,
            marginBottom: spacing.lg,
            gap: spacing.sm,
          },
        ]}
      >
        {(['30d', '90d', '1y'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            activeOpacity={0.7}
            style={[
              styles.periodButton,
              {
                backgroundColor:
                  period === p ? colors.primary : colors.surface,
                borderRadius: borderRadius.sm,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                typography.smallBold,
                {
                  color: period === p ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {p.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      {safeWeightValues.length >= 2 && (
        <LineChart
          data={{
            labels: safeLabels,
            datasets,
          }}
          width={chartWidth}
          height={200}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels
          withHorizontalLabels
          withShadow={false}
          fromZero={false}
          yAxisSuffix={` ${unitLabel}`}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: colors.surfaceElevated,
            backgroundGradientTo: colors.surfaceElevated,
            decimalCount: 1,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: () => colors.textTertiary,
            propsForDots: {
              r: '3',
              strokeWidth: '1',
              stroke: colors.accent,
            },
            propsForBackgroundLines: {
              strokeDasharray: '4,4',
              stroke: colors.border,
              strokeWidth: 1,
            },
          }}
          bezier
          style={{
            borderRadius: borderRadius.md,
            marginLeft: -spacing.lg,
          }}
        />
      )}

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.md, gap: spacing.lg }]}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.accent },
            ]}
          />
          <Text style={[typography.small, { color: colors.textSecondary }]}>
            Actual
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.primary },
            ]}
          />
          <Text style={[typography.small, { color: colors.textSecondary }]}>
            Rolling Avg
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDash,
              { backgroundColor: colors.error },
            ]}
          />
          <Text style={[typography.small, { color: colors.textSecondary }]}>
            Goal
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodButton: {},
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
});
