import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface RemainingBudgetProps {
  remaining: number;
  goal: number;
}

export default function RemainingBudget({ remaining, goal }: RemainingBudgetProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const isOver = remaining < 0;
  const absValue = Math.abs(Math.round(remaining));
  const pct = goal > 0 ? ((goal - remaining) / goal) * 100 : 0;

  const statusColor = isOver ? colors.error : colors.success;
  const statusBg = isOver ? colors.errorLight : colors.successLight;
  const icon = isOver ? 'warning-outline' : 'flame-outline';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: statusBg,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name={icon as any} size={22} color={statusColor} />
        <View style={[styles.textContent, { marginLeft: spacing.md }]}>
          <Text style={[typography.h3, { color: statusColor }]}>
            {absValue}{' '}
            <Text style={[typography.caption, { color: statusColor }]}>
              cal
            </Text>
          </Text>
          <Text
            style={[
              typography.caption,
              { color: statusColor, marginTop: 2 },
            ]}
          >
            {isOver ? 'over budget' : 'remaining'}
          </Text>
        </View>
      </View>

      {/* Progress track */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: isOver
              ? `${colors.error}30`
              : `${colors.success}30`,
            borderRadius: borderRadius.full,
            marginTop: spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(pct, 100)}%` as any,
              backgroundColor: statusColor,
              borderRadius: borderRadius.full,
            },
          ]}
        />
      </View>

      {/* Goal label */}
      <Text
        style={[
          typography.small,
          {
            color: statusColor,
            opacity: 0.7,
            marginTop: spacing.xs,
            textAlign: 'right',
          },
        ]}
      >
        Goal: {Math.round(goal)} cal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
