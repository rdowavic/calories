import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../theme';
import Card from '../common/Card';
import StatusBadge from './StatusBadge';

interface ProjectionCardProps {
  projectedDate: string;
  status: 'on_track' | 'behind' | 'ahead';
  daysRemaining: number;
}

export default function ProjectionCard({
  projectedDate,
  status,
  daysRemaining,
}: ProjectionCardProps) {
  const { colors, typography, spacing } = useTheme();

  let formattedDate: string;
  try {
    formattedDate = format(parseISO(projectedDate), 'MMM d, yyyy');
  } catch {
    formattedDate = projectedDate;
  }

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text
            style={[
              typography.h4,
              { color: colors.text, marginLeft: spacing.sm },
            ]}
          >
            Goal Projection
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={[styles.dateContainer, { marginTop: spacing.lg }]}>
        <Text style={[typography.numberSmall, { color: colors.text }]}>
          {formattedDate}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          Projected goal date
        </Text>
      </View>

      <View
        style={[
          styles.daysContainer,
          {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: spacing.md,
            marginTop: spacing.lg,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <Text
          style={[
            typography.bodyBold,
            { color: colors.text, marginLeft: spacing.sm },
          ]}
        >
          {daysRemaining}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginLeft: spacing.xs },
          ]}
        >
          days remaining
        </Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    alignItems: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
