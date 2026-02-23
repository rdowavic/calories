import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import Card from '../common/Card';

interface TodayImpactProps {
  impactDays: number;
}

export default function TodayImpact({ impactDays }: TodayImpactProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  // Positive impactDays = goal pushed further away (bad)
  // Negative impactDays = goal brought closer (good)
  const isBad = impactDays > 0;
  const isNeutral = impactDays === 0;

  const absValue = Math.abs(impactDays);
  const color = isNeutral
    ? colors.textSecondary
    : isBad
    ? colors.error
    : colors.success;
  const bgColor = isNeutral
    ? colors.surface
    : isBad
    ? colors.errorLight
    : colors.successLight;
  const icon = isNeutral
    ? 'remove-circle-outline'
    : isBad
    ? 'arrow-up-circle'
    : 'arrow-down-circle';

  const getMessage = () => {
    if (isNeutral) return "Today's intake has no impact on your projection";
    if (isBad) {
      return `Today's intake moves your goal ${absValue} day${absValue !== 1 ? 's' : ''} further`;
    }
    return `Today's intake brings your goal ${absValue} day${absValue !== 1 ? 's' : ''} closer`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${color}20`,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
            },
          ]}
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        <View style={[styles.textContent, { marginLeft: spacing.md }]}>
          <Text style={[typography.captionBold, { color }]}>
            Today's Impact
          </Text>
          <Text
            style={[
              typography.caption,
              { color, marginTop: spacing.xs, opacity: 0.85 },
            ]}
          >
            {getMessage()}
          </Text>
        </View>
      </View>

      {!isNeutral && (
        <View style={[styles.numberBadge, { marginTop: spacing.md }]}>
          <Text style={[typography.h3, { color, textAlign: 'center' }]}>
            {isBad ? '+' : '-'}{absValue}
          </Text>
          <Text
            style={[
              typography.small,
              { color, textAlign: 'center', opacity: 0.7 },
            ]}
          >
            {absValue !== 1 ? 'days' : 'day'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {},
  textContent: {
    flex: 1,
  },
  numberBadge: {
    alignItems: 'center',
  },
});
