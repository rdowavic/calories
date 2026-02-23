import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface MacroBarProps {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}

interface MacroColumnProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroColumn({ label, current, target, color }: MacroColumnProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={styles.column}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[typography.smallBold, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      <Text style={[typography.captionBold, { color: colors.text, marginTop: 2 }]}>
        {Math.round(current)}g
      </Text>
      <Text style={[typography.small, { color: colors.textTertiary }]}>
        / {Math.round(target)}g
      </Text>
    </View>
  );
}

export default function MacroBar({
  protein_g,
  carbs_g,
  fat_g,
  proteinTarget = 150,
  carbsTarget = 200,
  fatTarget = 65,
}: MacroBarProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const total = protein_g + carbs_g + fat_g;
  const proteinPct = total > 0 ? (protein_g / total) * 100 : 33.3;
  const carbsPct = total > 0 ? (carbs_g / total) * 100 : 33.3;
  const fatPct = total > 0 ? (fat_g / total) * 100 : 33.4;

  return (
    <View style={[styles.container, { marginVertical: spacing.md }]}>
      {/* Stacked bar */}
      <View
        style={[
          styles.barContainer,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
            height: 10,
          },
        ]}
      >
        {total > 0 && (
          <>
            <View
              style={{
                width: `${proteinPct}%` as any,
                height: '100%',
                backgroundColor: colors.proteinColor,
              }}
            />
            <View
              style={{
                width: `${carbsPct}%` as any,
                height: '100%',
                backgroundColor: colors.carbsColor,
              }}
            />
            <View
              style={{
                width: `${fatPct}%` as any,
                height: '100%',
                backgroundColor: colors.fatColor,
              }}
            />
          </>
        )}
      </View>

      {/* Macro columns */}
      <View style={[styles.columnsRow, { marginTop: spacing.md }]}>
        <MacroColumn
          label="Protein"
          current={protein_g}
          target={proteinTarget}
          color={colors.proteinColor}
        />
        <MacroColumn
          label="Carbs"
          current={carbs_g}
          target={carbsTarget}
          color={colors.carbsColor}
        />
        <MacroColumn
          label="Fat"
          current={fat_g}
          target={fatTarget}
          color={colors.fatColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  barContainer: {
    flexDirection: 'row',
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
