import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type Status = 'on_track' | 'behind' | 'ahead';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<
  Status,
  { icon: string; label: string; colorKey: 'statusOnTrack' | 'statusBehind' | 'statusAhead' }
> = {
  on_track: { icon: 'checkmark-circle', label: 'On Track', colorKey: 'statusOnTrack' },
  behind: { icon: 'warning', label: 'Behind', colorKey: 'statusBehind' },
  ahead: { icon: 'trending-up', label: 'Ahead', colorKey: 'statusAhead' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const config = STATUS_CONFIG[status];
  const color = colors[config.colorKey];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          borderRadius: borderRadius.full,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={14} color={color} />
      <Text
        style={[
          typography.smallBold,
          { color, marginLeft: spacing.xs },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
